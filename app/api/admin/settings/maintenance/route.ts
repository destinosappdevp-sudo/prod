import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const record = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (record?.role !== "ADMIN" && record?.role !== "SUPERADMIN") return null;
  return user;
}

export async function GET() {
  try {
    const prismaAny = prisma as any;
    let config = await prismaAny.platformConfig.findFirst();
    if (!config) {
      config = await prismaAny.platformConfig.create({
        data: { commissionPercent: 10, maintenanceMode: false },
      });
    }
    return NextResponse.json({ maintenanceMode: config.maintenanceMode ?? false });
  } catch {
    return NextResponse.json({ maintenanceMode: false });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { maintenanceMode } = await req.json();
  if (typeof maintenanceMode !== "boolean") {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  try {
    const prismaAny = prisma as any;
    let config = await prismaAny.platformConfig.findFirst();
    if (!config) {
      config = await prismaAny.platformConfig.create({
        data: { commissionPercent: 10, maintenanceMode },
      });
    } else {
      config = await prismaAny.platformConfig.update({
        where: { id: config.id },
        data: { maintenanceMode, updatedAt: new Date() },
      });
    }
    return NextResponse.json({ maintenanceMode: config.maintenanceMode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}



