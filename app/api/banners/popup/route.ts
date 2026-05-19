import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
import { normalizeExternalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const banner = await (prisma as any).banner.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: startOfTodayUtc },
        tipo: "POP",
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        url: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!banner) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      ...banner,
      url: normalizeExternalUrl(banner.url),
    });
  } catch (error) {
    console.error("Error fetching popup banner:", error);
    return NextResponse.json(null);
  }
}



