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

  return (
    <>
      {data.length === 0 ? (
        <Nothing
          title="Este destino pronto tendrá muchos listados"
          description="Verifica otra categoría o crea tu propio listado!"
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
          {data.map((item) => (
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
          ))}
        </div>
      )}
    </>
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
