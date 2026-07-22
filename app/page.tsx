import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import DestinationCard from "./components/DestinationCard";
import MapFilter from "./components/MapFilter";
import { HomeSearchBar } from "./components/HomeSearchBar";
import BannerCarousel from "./components/BannerCarousel";
import BannerMedio from "./components/BannerMedio";
import BannerPopup from "./components/BannerPopup";
import { Nothing } from "./components/Nothing";
import SkeletonCard from "./components/SkeletonCard";
import SearchResultsSplit from "./components/SearchResultsSplit";
import prisma from "./lib/db";
import {
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
    q?: string;
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
    country: searchParams?.country ?? undefined,
  };

  if (categoryNamesFilter.length > 0) {
    where.categoryName = { hasSome: categoryNamesFilter };
  }

  if (searchParams?.q?.trim()) {
    where.title = { contains: searchParams.q.trim(), mode: "insensitive" };
  }

  const destinations = await prismaAny.destination.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      subtitle: true,
      description: true,
      photo: true,
      country: true,
      municipality: true,
      categoryName: true,
      Homes: {
        where: { publishStatus: "APPROVED" },
        select: {
          id: true,
          price: true,
          priceVip: true,
          checkInTime: true,
        },
        orderBy: { checkInTime: { sort: "asc", nulls: "last" } },
      },
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
    orderBy: { createdAt: "desc" },
  });

  const data = destinations.map((destination: any) => {
    const futureHomes = destination.Homes.filter((h: any) => {
      if (!h.checkInTime) return false;
      const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
      return d.getTime() > Date.now();
    });
    const nextHome = futureHomes[0] || destination.Homes[0];
    const departure = nextHome?.checkInTime
      ? new Date(nextHome.checkInTime.includes("T") ? nextHome.checkInTime : `${nextHome.checkInTime}T00:00`)
      : null;
    const prices = destination.Homes.map((h: any) => [h.price, h.priceVip]).flat().filter((p: any) => typeof p === "number");
    const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

    return {
      ...destination,
      nextDate: departure
        ? departure.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
      nextTime: departure
        ? departure.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : null,
      priceFrom,
    };
  });

  const appConfig = await prismaAny.platformConfig.findFirst({
    select: { bcvRate: true },
  });
  const bcvRate: number | null = appConfig?.bcvRate ? Number(appConfig.bcvRate) : null;

  return { data, bcvRate };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    country?: string;
    guest?: string;
    rooms?: string;
    bathrooms?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container mx-auto px-5 lg:px-10">
      <BannerPopup />
      <BannerCarousel />
      <MapFilter />
      <HomeSearchBar />

      <Suspense key={`${sp?.filter}-${sp?.q}`} fallback={<SkeletonLoader />}>
        <ShowPlace searchParams={sp} />
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
    q?: string;
  };
}) {
  let userId: string | undefined;
  let data: Awaited<ReturnType<typeof getData>>["data"] = [];
  let bcvRate: number | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    const result = await getData({
      searchParams: searchParams,
      userId,
    });

    data = result.data;
    bcvRate = result.bcvRate;
  } catch (error) {
    console.error("[home] Error rendering listings:", error);

    return (
      <Nothing
        title="Estamos preparando los listados"
        description="Intenta nuevamente en unos minutos"
      />
    );
  }

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

  const renderCard = (item: typeof data[0]) => (
    <DestinationCard
      key={item.id}
      slug={item.slug}
      title={item.title}
      subtitle={item.subtitle}
      imagePath={item.photo}
      country={item.country}
      municipality={item.municipality}
      nextDate={item.nextDate}
      nextTime={item.nextTime}
      priceFrom={item.priceFrom}
      reviewCount={item._count?.Review || 0}
    />
  );

  if (isSearch) {
    return (
      <SearchResultsSplit pins={[]}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(renderCard)}
        </div>
      </SearchResultsSplit>
    );
  }

  return (
    <div className="mt-8 space-y-12">
      <section>
        <div className="flex items-center justify-between gap-2 mb-6 pb-2 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Full Days Disponibles 🏖️</h2>
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{data.length} destinos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(renderCard)}
        </div>
      </section>
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



