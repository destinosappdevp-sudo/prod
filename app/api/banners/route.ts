import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
import { normalizeExternalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    // Treat endDate as inclusive by day (records saved from date inputs usually land at 00:00:00 UTC).
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Solo banners tipo HERO para el carrusel principal
    const banners = await prisma.banner.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: startOfTodayUtc },
        tipo: { in: ["HERO1", "HERO2"] },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        url: true,
      },
      // updatedAt first makes recently reactivated banners appear first during development.
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
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



