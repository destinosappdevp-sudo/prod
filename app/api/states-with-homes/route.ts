import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET() {
  const rows = await (prisma as any).home.groupBy({
    by: ["country"],
    where: {
      country: { not: null },
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
      publishStatus: "APPROVED",
    },
    _count: { country: true },
  });

  const stateValues: string[] = rows
    .map((r: { country: string | null }) => r.country)
    .filter(Boolean);

  return NextResponse.json(stateValues);
}



