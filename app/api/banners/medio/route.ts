import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
import { normalizeExternalUrl } from "@/lib/utils";

export async function GET() {
  try {
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        tipo: { in: ["MEDIO1", "MEDIO2"] },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        url: true,
        tipo: true,
      },
      orderBy: { createdAt: "desc" },
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
