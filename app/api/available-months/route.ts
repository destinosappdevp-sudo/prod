import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prismaAny = prisma as any;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const homes = await prismaAny.home.findMany({
      where: {
        publishStatus: "APPROVED",
        checkInTime: { gte: nowStr },
      },
      select: { checkInTime: true },
    });

    const monthSet = new Set<string>();
    homes.forEach((h: any) => {
      if (!h.checkInTime) return;
      const d = new Date(h.checkInTime);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthSet.add(key);
    });

    const sorted = Array.from(monthSet).sort();

    const results = sorted.map((key) => {
      const [yearStr, monthStr] = key.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const d = new Date(year, month - 1, 1);
      const label = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      return { value: key, label: label.charAt(0).toUpperCase() + label.slice(1) };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching available months:", error);
    return NextResponse.json([], { status: 200 });
  }
}
