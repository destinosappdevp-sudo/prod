import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import ListingCard from "./components/ListingCard";
import MapFilter from "./components/MapFilter";
import BannerCarousel from "./components/BannerCarousel";
import BannerMedio from "./components/BannerMedio";
import { Nothing } from "./components/Nothing";
import SkeletonCard from "./components/SkeletonCard";
import { HorizontalCarousel } from "./components/HorizontalCarousel";
import SearchResultsSplit from "./components/SearchResultsSplit";
import prisma from "./lib/db";
import { getStateByValue } from "./lib/venezuelaStates";
import { getMunicipalityByValue } from "./lib/venezuelaMunicipalities";
import MobileMapStrip from "./components/MobileMapStrip";

async function getData({
  searchParams,
  userId,
}: {
  userId: string | undefined;
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    rooms?: string;
    bathrooms?: string;
  };
}) {
  noStore();
  const rawCategoryFilter = searchParams?.filter;
  let categoryFilter: string | undefined;

  if (rawCategoryFilter && rawCategoryFilter !== "todos") {
    if (/^\d+$/.test(rawCategoryFilter)) {
      const category = await (prisma as any).property_types.findUnique({
        where: { id: Number(rawCategoryFilter) },
        select: { name: true },
      });

      categoryFilter = category?.name || "__no_category_match__";
    } else {
      // Compatibilidad con URLs antiguas que usan nombre en vez de id.
      categoryFilter = rawCategoryFilter;
    }
  }

  const data = await prisma.home.findMany({
    where: {
      publishStatus: "APPROVED",
      addedCategory: true,
      addedLocation: true,
      addedDescription: true,
      categoryName: categoryFilter,
      country: searchParams?.country ?? undefined,
      guests: searchParams?.guest ? { gte: searchParams.guest } : undefined,
      bedrooms: searchParams?.rooms ? { gte: searchParams.rooms } : undefined,
      bathrooms: searchParams?.bathrooms ? { gte: searchParams.bathrooms } : undefined,
    },
    select: {
      title: true,
      photo: true,
      id: true,
      price: true,
      description: true,
      country: true,
      municipality: true,
      categoryName: true,
      guests: true,
      bedrooms: true,
      exactAddress: true,
      latitude: true,
      longitude: true,
      Review: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          Review: true,
        },
      },
      Favorite: { where: { userId: userId ?? undefined } },
    },
  });
  return data;
}

export default function Home({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    rooms?: string;
    bathrooms?: string;
  };
}) {
  return (
    <div className="container mx-auto px-5 lg:px-10">
      <BannerCarousel />
      <MapFilter />

      <Suspense key={searchParams?.filter} fallback={<SkeletonLoader />}>
        <ShowPlace searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const REGIONES: { title: string; states: string[] }[] = [
  {
    title: "Región Centro",
    states: ["CC", "MI", "AR", "CA", "VA", "CO", "GU"],
  },
  {
    title: "Región Oriente",
    states: ["AN", "SU", "MO", "NE", "BO", "DA", "AM"],
  },
  {
    title: "Región Occidente",
    states: ["ZU", "TA", "ME", "TR", "LA", "YA", "PO", "BA", "AP", "FA"],
  },
];

async function ShowPlace({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    guest?: string;
    rooms?: string;
    bathrooms?: string;
  };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const data = await getData({ searchParams: searchParams, userId: user?.id });

  // Is this a search? (any filter active)
  const isSearch = !!(searchParams?.country || searchParams?.rooms || searchParams?.bathrooms || searchParams?.guest);

  if (data.length === 0) {
    return (
      <Nothing
        title="Este destino pronto tendrá muchos listados"
        description="Verifica otra categoría o crea tu propio listado!"
      />
    );
  }

  // Build pins for search map
  const pins = data.map((item, index) => {
    // Usar coordenadas específicas de la propiedad si están disponibles
    if (item.latitude && item.longitude) {
      return {
        id: item.id,
        title: item.title as string,
        price: item.price as number,
        lat: item.latitude,
        lng: item.longitude,
        image: item.photo as string,
      };
    }
    
    // Fallback a coordenadas del municipio/estado
    const muni = item.country && item.municipality
      ? getMunicipalityByValue(item.country as string, item.municipality as string)
      : null;
    const state = item.country ? getStateByValue(item.country as string) : null;
    const latLng = muni?.latLng ?? state?.latLng ?? [10.5, -66.9];
    
    // Si las propiedades tienen la misma ubicación, añadir un pequeño offset para separarlas
    const offset = index * 0.001;
    
    return {
      id: item.id,
      title: item.title as string,
      price: item.price as number,
      lat: (latLng as [number, number])[0] + offset,
      lng: (latLng as [number, number])[1] + offset,
      image: item.photo as string,
    };
  });

  const renderCard = (item: typeof data[0]) => (
    <ListingCard
      key={item.id}
      title={item.title as string}
      description={item.description as string}
      imagePath={item.photo as string}
      price={item.price as number}
      stateValue={item.country as string}
      municipalityValue={item.municipality}
      userId={user?.id}
      favoriteId={item.Favorite[0]?.id}
      isInFavoriteList={item.Favorite.length > 0}
      homeId={item.id}
      pathName="/"
      categoryName={item.categoryName}
      guests={item.guests}
      bedrooms={item.bedrooms}
      reviews={item.Review}
      reviewCount={item._count?.Review}
    />
  );

  if (isSearch) {
    return (
      <SearchResultsSplit pins={pins}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map(renderCard)}
        </div>
      </SearchResultsSplit>
    );
  }

  // Propiedades sin región asignada o con estado desconocido
  const assignedStates = new Set(REGIONES.flatMap((r) => r.states));
  const sinRegion = data
    .filter((item) => !item.country || !assignedStates.has(item.country as string))
    .slice(-9);

  const renderCarouselCard = (item: typeof data[0]) => (
    <div key={item.id} className="min-w-[260px] w-[260px] flex-shrink-0">
      <ListingCard
        title={item.title as string}
        description={item.description as string}
        imagePath={item.photo as string}
        price={item.price as number}
        stateValue={item.country as string}
        municipalityValue={item.municipality}
        userId={user?.id}
        favoriteId={item.Favorite[0]?.id}
        isInFavoriteList={item.Favorite.length > 0}
        homeId={item.id}
        pathName="/"
        categoryName={item.categoryName}
        guests={item.guests}
        bedrooms={item.bedrooms}
        reviews={item.Review}
        reviewCount={item._count?.Review}
      />
    </div>
  );

  return (
    <div className="mt-8 space-y-12">
      <MobileMapStrip pins={pins} />
      {REGIONES.map((region, index) => {
        const items = data
          .filter((item) => region.states.includes(item.country as string))
          .slice(-9);
        if (items.length === 0) return null;
        return (
          <>
            <HorizontalCarousel key={region.title} title={region.title}>
              {items.map(renderCarouselCard)}
            </HorizontalCarousel>
            {/* Banner MEDIO1 después de Región Centro (index 0) */}
            {index === 0 && <BannerMedio tipo="MEDIO1" />}
            {/* Banner MEDIO2 después de Región Oriente (index 1) */}
            {index === 1 && <BannerMedio tipo="MEDIO2" />}
          </>
        );
      })}
      {sinRegion.length > 0 && (
        <HorizontalCarousel title="Otras Regiones">
          {sinRegion.map(renderCarouselCard)}
        </HorizontalCarousel>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="flex gap-5 overflow-hidden mt-8">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
