import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "6");
    const take = Math.min(Math.max(Number.isFinite(limitParam) ? Math.floor(limitParam) : 6, 1), 12);

    const prismaAny = prisma as any;
    const destinations = await prismaAny.destination.findMany({
      where: {
        publishStatus: "APPROVED",
        title: q
          ? {
              contains: q,
              mode: "insensitive",
            }
          : undefined,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        country: true,
        municipality: true,
        Homes: {
          where: { publishStatus: "APPROVED" },
          select: { checkInTime: true },
          orderBy: { checkInTime: { sort: "asc", nulls: "last" } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    const results = destinations.map((destination: any) => ({
      id: destination.id,
      slug: destination.slug,
      title: destination.title,
      country: destination.country,
      municipality: destination.municipality,
      checkInTime: destination.Homes[0]?.checkInTime || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching destinations:", error);
    return NextResponse.json([], { status: 200 });
  }
}
