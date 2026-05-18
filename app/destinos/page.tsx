import { createClient } from "@/app/lib/supabase/server";
import BannerCarousel from "@/app/components/BannerCarousel";
import ListingCard from "@/app/components/ListingCard";
import prisma from "@/app/lib/db";
import {
  getPrimaryCategoryName,
  parseMultiCategoryFilter,
} from "@/app/lib/property-categories";
import { generateHomeSlug } from "@/app/lib/slug";
import ReviewsSection from "@/app/components/ReviewsSection";
import Image from "next/image";
import Link from "next/link";

const prismaAny = prisma as any;

const categoryChips = [
  { name: "Todos", icon: "/media/todos.webp" },
  { name: "Aventura", icon: "/media/aventuras.webp" },
  { name: "Islas", icon: "/media/islas.webp" },
  { name: "Montañas", icon: "/media/montañas.webp" },
  { name: "Playas", icon: "/media/playas.webp" },
];

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildFilterHref(
  searchParams: Record<string, string | undefined>,
  nextTokens: string[]
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === "string" && value.length > 0 && key !== "filter") {
      params.set(key, value);
    }
  });

  if (nextTokens.length === 0) {
    params.set("filter", "todos");
  } else {
    params.set("filter", nextTokens.join(","));
  }

  return `/destinos?${params.toString()}`;
}

async function getListings({
  userId,
  searchParams,
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

  const data = await prismaAny.home.findMany({
    where: {
      publishStatus: "APPROVED",
      addedCategory: true,
      addedLocation: true,
      addedDescription: true,
      country: searchParams?.country ?? undefined,
      guests: searchParams?.guest ? { gte: searchParams.guest } : undefined,
      bedrooms: searchParams?.rooms ? { gte: searchParams.rooms } : undefined,
      bathrooms: searchParams?.bathrooms
        ? { gte: searchParams.bathrooms }
        : undefined,
      title: searchParams?.q?.trim()
        ? { contains: searchParams.q.trim(), mode: "insensitive" }
        : undefined,
      ...(categoryNamesFilter.length > 0
        ? { categoryName: { hasSome: categoryNamesFilter } }
        : {}),
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
      contactNumber: true,
      checkInTime: true,
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
    orderBy: [
      { checkInTime: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: 12,
  });

  const appConfig = await prismaAny.platformConfig.findFirst({
    select: { bcvRate: true },
  });
  const bcvRate: number | null = appConfig?.bcvRate ? Number(appConfig.bcvRate) : null;

  return { data, bcvRate };
}

export default async function DestinosHomePage({
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, bcvRate } = await getListings({
    userId: user?.id,
    searchParams,
  });

  const selectedTokens = parseMultiCategoryFilter(searchParams?.filter);
  const selectedSet = new Set(selectedTokens);

  const propertyTypes = (await prismaAny.property_types.findMany({
    select: { id: true, name: true },
  })) as Array<{ id: number; name: string }>;

  const chipsWithToken = categoryChips.map((chip) => {
    if (chip.name === "Todos") {
      return { ...chip, token: "todos", isActive: selectedTokens.length === 0 };
    }

    const matched = propertyTypes.find((type) => {
      const normalizedType = normalizeForMatch(type.name);
      const normalizedChip = normalizeForMatch(chip.name);
      return (
        normalizedType.includes(normalizedChip) ||
        normalizedChip.includes(normalizedType)
      );
    });

    const token = matched ? String(matched.id) : chip.name;
    const isActive =
      selectedSet.has(token) ||
      (matched ? selectedSet.has(matched.name) : selectedSet.has(chip.name));

    return { ...chip, token, isActive };
  });

  const safeSearchParams: Record<string, string | undefined> = {
    filter: searchParams?.filter,
    country: searchParams?.country,
    guest: searchParams?.guest,
    rooms: searchParams?.rooms,
    bathrooms: searchParams?.bathrooms,
    q: searchParams?.q,
  };

  return (
    <div className="min-h-screen bg-[#E5DCC6]">
      <section className="relative">
        <BannerCarousel
          fullWidth
          compactHeight
          showTitle={false}
          showArrows={false}
          autoRotate
          autoRotateMs={4500}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#040B42]/35 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-6 z-20 sm:left-10 lg:left-14">
          <a
            href="/contacto"
            className="inline-flex rounded-full bg-[#E0AE33] px-6 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-[#c99723]"
          >
            Reservar cupo
          </a>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#E5DCC6] to-transparent" />
      </section>

      <section className="mx-auto max-w-7xl px-6 -mt-4 sm:px-10 lg:px-14">
        <div className="flex flex-wrap items-start justify-center gap-6 sm:gap-8">
          {chipsWithToken.map((cat) => (
            <Link
              key={cat.name}
              href={
                cat.token === "todos"
                  ? buildFilterHref(safeSearchParams, [])
                  : buildFilterHref(safeSearchParams, [cat.token])
              }
              className="group flex w-24 flex-col items-center gap-2 bg-transparent"
            >
              <span
                className={`relative block h-20 w-20 overflow-hidden rounded-full border-2 shadow-md transition-transform duration-300 group-hover:scale-105 ${
                  cat.isActive
                    ? "border-[#E0AE33] ring-2 ring-[#E0AE33]/80"
                    : "border-white/60"
                }`}
              >
                <Image
                  src={cat.icon}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </span>
              <span
                className={`text-sm font-semibold ${
                  cat.isActive ? "text-[#040B42]" : "text-[#1a2d67]"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:px-10 lg:px-14">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-semibold text-[#0d1f58]">Destinos Destacados</h2>
          <p className="mt-2 text-lg text-[#24336a]">Descubre lugares increibles</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((item: any) => (
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
              pathName="/destinos"
              categoryName={getPrimaryCategoryName(item.categoryName)}
              categoryNames={item.categoryName}
              guests={item.guests}
              bedrooms={item.bedrooms}
              reviews={item.Review}
              reviewCount={item._count?.Review}
              contactNumber={item.contactNumber}
              checkInTime={(item as any).checkInTime}
              bcvRate={bcvRate}
              slug={generateHomeSlug(item.title || "paquete", item.id)}
            />
          ))}
        </div>

        {data.length === 0 && (
          <div className="rounded-xl border border-[#d5c9af] bg-white/60 p-8 text-center text-[#24336a]">
            Aun no hay paquetes publicados para mostrar en esta seccion.
          </div>
        )}
      </section>

      <div className="w-full pt-0">
        <ReviewsSection />
      </div>
    </div>
  );
}
