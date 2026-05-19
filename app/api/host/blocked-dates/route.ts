import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const homeId = searchParams.get("homeId");
    if (!homeId) return NextResponse.json({ error: "homeId requerido" }, { status: 400 });

    // Verificar que la propiedad le pertenece al host
    const home = await prisma.home.findFirst({ where: { id: homeId, userId: user.id } });
    if (!home) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    const blocked = await (prisma as any).blockedDate.findMany({
      where: { homeId },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ blocked });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const homeId = typeof body?.homeId === "string" ? body.homeId.trim() : "";
    const startDate = typeof body?.startDate === "string" ? body.startDate : "";
    const endDate = typeof body?.endDate === "string" ? body.endDate : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : null;

    if (!homeId || !startDate || !endDate) {
      return NextResponse.json({ error: "homeId, startDate y endDate son requeridos" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ error: "Las fechas no son válidas" }, { status: 400 });
    }

    // Verificar que la propiedad le pertenece al host
    const home = await prisma.home.findFirst({ where: { id: homeId, userId: user.id } });
    if (!home) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });

    const blocked = await (prisma as any).blockedDate.create({
      data: { homeId, startDate: start, endDate: end, reason: reason || null },
    });

    return NextResponse.json({ blocked }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}



