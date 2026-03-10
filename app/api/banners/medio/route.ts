import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
import { normalizeExternalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    // Keep date-range behavior inclusive for endDate when values come from date-only inputs.
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const banners = await prisma.banner.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: startOfTodayUtc },
        tipo: { in: ["MEDIO1", "MEDIO2"] },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        url: true,
        tipo: true,
      },
      // Prioritize recently edited/reactivated banners over old creation order.
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const result = banners.map((b) => ({
      ...b,
      url: normalizeExternalUrl(b.url),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching medio banners:", error);
    return NextResponse.json({ error: "Error fetching banners" }, { status: 500 });
  }
}
