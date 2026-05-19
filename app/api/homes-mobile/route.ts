import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import {
  getPrimaryCategoryName,
  normalizeCategoryNames,
  parseMultiCategoryFilter,
} from "@/app/lib/property-categories";

export const dynamic = "force-dynamic";

type MobileHome = {
  id: string;
  title: string;
  description: string | null;
  country: string | null;
  municipality: string | null;
  exactAddress: string | null;
  categoryName: string | null;
  guests: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  price: number | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value: string | null): string {
  return (value ?? "").trim();
}

function buildPhotoUrl(photo: string | null): string | null {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/images/${photo}`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const query = normalizeText(searchParams.get("q"));
    const country = normalizeText(searchParams.get("country"));
    const municipality = normalizeText(searchParams.get("municipality"));
    const category = normalizeText(searchParams.get("category"));
    const categoryTokens = parseMultiCategoryFilter(category);
    const minPrice = parseNumber(searchParams.get("minPrice"));
    const maxPrice = parseNumber(searchParams.get("maxPrice"));
    const guests = parseNumber(searchParams.get("guests"));

    const neLat = parseNumber(searchParams.get("neLat"));
    const neLng = parseNumber(searchParams.get("neLng"));
    const swLat = parseNumber(searchParams.get("swLat"));
    const swLng = parseNumber(searchParams.get("swLng"));

    const limitParam = parseNumber(searchParams.get("limit"));
    const take = Math.min(Math.max(Math.floor(limitParam ?? 120), 20), 300);

    let categoryNamesFilter: string[] = [];

    if (categoryTokens.length > 0) {
      const categoryIds = categoryTokens
        .filter((token) => /^\d+$/.test(token))
        .map((token) => Number(token));

      const prismaAny = prisma as any;
      const propertyTypes =
        prismaAny.property_types ?? prismaAny.propertyTypes ?? prismaAny.propertyType;

      const categoriesById =
        categoryIds.length > 0 && propertyTypes?.findMany
          ? ((await propertyTypes.findMany({
              where: { id: { in: categoryIds } },
              select: { id: true, name: true },
            })) as Array<{ id: number; name: string }>).sort(
              (a, b) => categoryIds.indexOf(a.id) - categoryIds.indexOf(b.id)
            )
          : [];

      categoryNamesFilter = Array.from(
        new Set([
          ...categoriesById.map((categoryItem) => categoryItem.name),
          ...categoryTokens.filter((token) => !/^\d+$/.test(token)),
        ])
      );
    }

    const homes = await prisma.home.findMany({
      where: {
        addedCategory: true,
        addedDescription: true,
        addedLocation: true,
        publishStatus: "APPROVED",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        country: true,
        municipality: true,
        exactAddress: true,
        categoryName: true,
        guests: true,
        bedrooms: true,
        bathrooms: true,
        price: true,
        latitude: true,
        longitude: true,
        photo: true,
        createdAt: true,
      },
      orderBy: [
        { checkInTime: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 1000,
    });

    const normalizedQuery = query.toLowerCase();

    const result = homes
      .filter((home) => {
        if (home.latitude == null || home.longitude == null) return false;

        if (country && (home.country ?? "").toLowerCase() !== country.toLowerCase()) {
          return false;
        }

        if (
          municipality &&
          (home.municipality ?? "").toLowerCase() !== municipality.toLowerCase()
        ) {
          return false;
        }

        const normalizedHomeCategories = normalizeCategoryNames(
          home.categoryName
        ).map((item) => item.toLowerCase());

        if (
          categoryNamesFilter.length > 0 &&
          !categoryNamesFilter.some((item) => normalizedHomeCategories.includes(item.toLowerCase()))
        ) {
          return false;
        }

        if (minPrice != null && (home.price ?? 0) < minPrice) {
          return false;
        }

        if (maxPrice != null && (home.price ?? 0) > maxPrice) {
          return false;
        }

        if (guests != null) {
          const homeGuests = Number(home.guests ?? "0");
          if (Number.isFinite(homeGuests) && homeGuests < guests) {
            return false;
          }
        }

        if (neLat != null && neLng != null && swLat != null && swLng != null) {
          if (
            home.latitude < swLat ||
            home.latitude > neLat ||
            home.longitude < swLng ||
            home.longitude > neLng
          ) {
            return false;
          }
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchableText = [
          home.title,
          home.description,
          home.country,
          home.municipality,
          home.exactAddress,
          ...normalizeCategoryNames(home.categoryName),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, take)
      .map<MobileHome>((home) => ({
        id: home.id,
        title: home.title?.trim() || "Propiedad sin título",
        description: home.description,
        country: home.country,
        municipality: home.municipality,
        exactAddress: home.exactAddress,
        categoryName: getPrimaryCategoryName(home.categoryName),
        guests: home.guests,
        bedrooms: home.bedrooms,
        bathrooms: home.bathrooms,
        price: home.price,
        latitude: home.latitude!,
        longitude: home.longitude!,
        photoUrl: buildPhotoUrl(home.photo),
      }));

    return NextResponse.json(
      {
        homes: result,
        count: result.length,
      },
      {
        headers: CORS_HEADERS,
      }
    );
  } catch (error: any) {
    console.error("[homes-mobile] error:", error);

    return NextResponse.json(
      {
        error: error?.message || "No se pudieron cargar las propiedades",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}


