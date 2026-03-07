  import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
  import { normalizeExternalUrl } from "@/lib/utils";

export async function GET() {
  try {
    const now = new Date();

    // Solo banners tipo HERO para el carrusel principal
    const banners = await prisma.banner.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        tipo: { in: ["HERO1", "HERO2"] },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        url: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const normalizedBanners = banners.map((banner) => ({
      ...banner,
      url: normalizeExternalUrl(banner.url),
    }));

    return NextResponse.json(normalizedBanners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Error fetching banners" },
      { status: 500 }
    );
  }
}
