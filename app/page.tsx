import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import ListingCard from "./components/ListingCard";
import MapFilter from "./components/MapFilter";
import BannerCarousel from "./components/BannerCarousel";
import { Nothing } from "./components/Nothing";
import SkeletonCard from "./components/SkeletonCard";
import prisma from "./lib/db";

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
  const data = await prisma.home.findMany({
    where: {
      publishStatus: "APPROVED",
      addedCategory: true,
      addedLocation: true,
      addedDescription: true,
      categoryName: searchParams?.filter ?? undefined,
      country: searchParams?.country ?? undefined,
      bedrooms: searchParams?.rooms ?? undefined,
      bathrooms: searchParams?.bathrooms ?? undefined,
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

  if (data.length === 0) {
    return (
      <Nothing
        title="Este destino pronto tendrá muchos listados"
        description="Verifica otra categoría o crea tu propio listado!"
      />
    );
  }

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
      isInFavoriteList={item.Favorite.length > 0 ? true : false}
      homeId={item.id}
      pathName="/"
      categoryName={item.categoryName}
      guests={item.guests}
      bedrooms={item.bedrooms}
      reviews={item.Review}
      reviewCount={item._count?.Review}
    />
  );

  // Propiedades sin región asignada o con estado desconocido
  const assignedStates = new Set(REGIONES.flatMap((r) => r.states));
  const sinRegion = data.filter(
    (item) => !item.country || !assignedStates.has(item.country as string)
  );

  return (
    <div className="mt-8 space-y-12">
      {REGIONES.map((region) => {
        const items = data.filter((item) =>
          region.states.includes(item.country as string)
        );
        if (items.length === 0) return null;
        return (
          <section key={region.title}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              {region.title}
            </h2>
            <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {items.map(renderCard)}
            </div>
          </section>
        );
      })}
      {sinRegion.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
            Otras Regiones
          </h2>
          <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {sinRegion.map(renderCard)}
          </div>
        </section>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
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
