import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import ListingCard from "./components/ListingCard";
import MapFilter from "./components/MapFilter";
import BannerCarousel from "./components/BannerCarousel";
import BannerMedio from "./components/BannerMedio";
import { Nothing } from "./components/Nothing";
import SkeletonCard from "./components/SkeletonCard";
import SearchResultsSplit from "./components/SearchResultsSplit";
import prisma from "./lib/db";
import { getStateByValue } from "./lib/venezuelaStates";
import { getMunicipalityByValue } from "./lib/venezuelaMunicipalities";
import MobileMapStrip from "./components/MobileMapStrip";
import {
  getPrimaryCategoryName,
  parseMultiCategoryFilter,
} from "./lib/property-categories";

const prismaAny = prisma as any;

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
  const categoryFilterTokens = parseMultiCategoryFilter(rawCategoryFilter);
  let categoryNamesFilter: string[] = [];

  if (categoryFilterTokens.length > 0) {
    const categoryIds = categoryFilterTokens
      .filter((token) => /^\d+$/.test(token))
      .map((token) => Number(token));

    const namesFromIds =
      categoryIds.length > 0
        ? ((await prismaAny.property_types.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })) as Array<{ id: number; name: string }>).sort(
            (a, b) => categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id)
          )
        : [];

    const namesFromLegacyTokens = categoryFilterTokens.filter(
      (token) => !/^\d+$/.test(token)
    );

    categoryNamesFilter = Array.from(
      new Set([
        ...namesFromIds.map((category) => category.name),
        ...namesFromLegacyTokens,
      ])
    );
  }

  const where: any = {
    publishStatus: "APPROVED",
    addedCategory: true,
    addedLocation: true,
    addedDescription: true,
    country: searchParams?.country ?? undefined,
    guests: searchParams?.guest ? { gte: searchParams.guest } : undefined,
    bedrooms: searchParams?.rooms ? { gte: searchParams.rooms } : undefined,
    bathrooms: searchParams?.bathrooms ? { gte: searchParams.bathrooms } : undefined,
  };

  if (categoryNamesFilter.length > 0) {
    where.categoryName = { hasSome: categoryNamesFilter };
  }

  const data = await prismaAny.home.findMany({
    where,
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
      contactNumber: true,
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

  const appConfig = await prismaAny.platformConfig.findFirst({
    select: { bcvRate: true },
  });
  const bcvRate: number | null = appConfig?.bcvRate ? Number(appConfig.bcvRate) : null;

  return { data, bcvRate };
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
  const { data, bcvRate } = await getData({ searchParams: searchParams, userId: user?.id });

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
  const pins = data.map((item: (typeof data)[number], index: number) => {
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
    const muni = item.country && item.municipality
      ? getMunicipalityByValue(item.country as string, item.municipality as string)
      : null;
    const state = item.country ? getStateByValue(item.country as string) : null;
    const latLng = muni?.latLng ?? state?.latLng ?? [10.5, -66.9];
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
      categoryName={getPrimaryCategoryName(item.categoryName)}
      categoryNames={item.categoryName}
      guests={item.guests}
      bedrooms={item.bedrooms}
      reviews={item.Review}
      reviewCount={item._count?.Review}
      contactNumber={item.contactNumber}
      bcvRate={bcvRate}
    />
  );

  if (isSearch) {
    return (
      <SearchResultsSplit pins={pins}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(renderCard)}
        </div>
      </SearchResultsSplit>
    );
  }

  type HomeItem = (typeof data)[number];
  const assignedStates = new Set(REGIONES.flatMap((r) => r.states));
  const sinRegion = data
    .filter(
      (item: HomeItem) =>
        !item.country || !assignedStates.has(item.country as string)
    )
    .slice(-9);

  return (
    <div className="mt-8 space-y-12">
      <MobileMapStrip pins={pins} />
      {REGIONES.map((region, index) => {
        const items = data
          .filter((item: HomeItem) => region.states.includes(item.country as string))
          .slice(-9);
        if (items.length === 0) return null;
        return (
          <section key={region.title}>
            <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{region.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(renderCard)}
            </div>
            {index === 0 && <div className="mt-8"><BannerMedio tipo="MEDIO1" /></div>}
            {index === 1 && <div className="mt-8"><BannerMedio tipo="MEDIO2" /></div>}
          </section>
        );
      })}
      {sinRegion.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Otras Regiones</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sinRegion.map(renderCard)}
          </div>
        </section>
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
