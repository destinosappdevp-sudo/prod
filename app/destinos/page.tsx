import { createClient } from "@/app/lib/supabase/server";
import BannerCarousel from "@/app/components/BannerCarousel";
import DestinationCard from "@/app/components/DestinationCard";
import prisma from "@/app/lib/db";
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

function formatNextDeparture(departureDate?: Date | string | null) {
  if (!departureDate) return { date: null, time: null };
  const d = new Date(departureDate);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  return {
    date: d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

async function getDestinations({
  userId,
  searchParams,
}: {
  userId: string | undefined;
  searchParams?: {
    filter?: string;
    country?: string;
    q?: string;
  };
}) {
  const categoryFilterTokens = (searchParams?.filter || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let categoryNamesFilter: string[] = [];

  if (categoryFilterTokens.length > 0 && !categoryFilterTokens.includes("todos")) {
    const propertyTypes = await prismaAny.property_types.findMany({
      select: { id: true, name: true },
    });
    const matchedNames = propertyTypes
      .filter((pt: any) => categoryFilterTokens.includes(String(pt.id)) || categoryFilterTokens.includes(pt.name))
      .map((pt: any) => pt.name);
    categoryNamesFilter = Array.from(new Set([...matchedNames, ...categoryFilterTokens]));
  }

  const destinations = await prismaAny.destination.findMany({
    where: {
      publishStatus: "APPROVED",
      country: searchParams?.country ?? undefined,
      title: searchParams?.q?.trim()
        ? { contains: searchParams.q.trim(), mode: "insensitive" }
        : undefined,
      ...(categoryNamesFilter.length > 0
        ? { categoryName: { hasSome: categoryNamesFilter } }
        : {}),
    },
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
        select: { rating: true },
      },
      _count: {
        select: { Review: true },
      },
      Favorite: { where: { userId: userId ?? undefined } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return destinations.map((destination: any) => {
    const futureHomes = destination.Homes.filter((h: any) => {
      if (!h.checkInTime) return false;
      const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
      return d.getTime() > Date.now();
    });

    const nextHome = futureHomes[0] || destination.Homes[0];
    const departure = formatNextDeparture(nextHome?.checkInTime);
    const prices = destination.Homes.map((h: any) => [h.price, h.priceVip]).flat().filter((p: any) => typeof p === "number");
    const priceFrom = prices.length > 0 ? Math.min(...prices) : null;

    return {
      ...destination,
      nextDate: departure.date,
      nextTime: departure.time,
      priceFrom,
    };
  });
}

export default async function DestinosHomePage({
  searchParams,
}: {
  searchParams?: {
    filter?: string;
    country?: string;
    q?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const destinations = await getDestinations({
    userId: user?.id,
    searchParams,
  });

  const selectedTokens = (searchParams?.filter || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const selectedSet = new Set(selectedTokens);

  const propertyTypes = (await prismaAny.property_types.findMany({
    select: { id: true, name: true },
  })) as Array<{ id: number; name: string }>;

  const chipsWithToken = categoryChips.map((chip) => {
    if (chip.name === "Todos") {
      return { ...chip, token: "todos", isActive: selectedTokens.length === 0 || selectedTokens.includes("todos") };
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
    q: searchParams?.q,
  };

  return (
    <div className="min-h-screen bg-background">
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background to-transparent" />
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
          <p className="mt-2 text-lg text-[#24336a]">Descubre lugares increíbles</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination: any) => (
            <DestinationCard
              key={destination.id}
              slug={destination.slug}
              title={destination.title}
              subtitle={destination.subtitle}
              imagePath={destination.photo}
              country={destination.country}
              municipality={destination.municipality}
              nextDate={destination.nextDate}
              nextTime={destination.nextTime}
              priceFrom={destination.priceFrom}
              reviewCount={destination._count?.Review || 0}
            />
          ))}
        </div>

        {destinations.length === 0 && (
          <div className="rounded-xl border border-[#d5c9af] bg-white/60 p-8 text-center text-[#24336a]">
            Aún no hay destinos publicados para mostrar en esta sección.
          </div>
        )}
      </section>

      <div className="w-full pt-0">
        <ReviewsSection />
      </div>
    </div>
  );
}
