import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

function normalizeCategoryLabel(name: string) {
  if (!name) return "";

  if (name.includes("Ã") || name.includes("Â")) {
    try {
      const bytes = Uint8Array.from(name, (char) => char.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return name;
    }
  }

  return name;
}

export async function GET() {
  try {
    const propertyTypes =
      prismaAny.property_types ?? prismaAny.propertyTypes ?? prismaAny.propertyType;

    if (!propertyTypes?.findMany) {
      return NextResponse.json([]);
    }

    const categories = await propertyTypes.findMany({
      select: {
        id: true,
        name: true,
        icon: true,
      },
      orderBy: [{ name: "asc" }],
    });

    const normalizedCategories = categories.map((category: { id: number; name: string; icon: string | null }) => ({
      ...category,
      name: normalizeCategoryLabel(category.name),
    }));

    return NextResponse.json(normalizedCategories);
  } catch (error) {
    console.error("Error fetching property types:", error);
    return NextResponse.json(
      { error: "Error fetching property types" },
      { status: 500 }
    );
  }
}