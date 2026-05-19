import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "6");
    const take = Math.min(Math.max(Number.isFinite(limitParam) ? Math.floor(limitParam) : 6, 1), 12);

    const results = await (prisma as any).home.findMany({
      where: {
        publishStatus: "APPROVED",
        addedCategory: true,
        addedDescription: true,
        addedLocation: true,
        title: q
          ? {
              contains: q,
              mode: "insensitive",
            }
          : undefined,
      },
      select: {
        id: true,
        title: true,
        country: true,
        municipality: true,
        checkInTime: true,
        slug: true,
        categoryName: true,
      },
      orderBy: [
        { checkInTime: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching destinations:", error);
    return NextResponse.json([], { status: 200 });
  }
}



