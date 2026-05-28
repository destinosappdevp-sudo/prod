import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return false;
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  return record?.role === "SUPERADMIN";
}

// GET: Obtener el porcentaje de comisión actual
export async function GET() {
  const config = await prisma.platformConfig.findFirst();
  return NextResponse.json({ commissionPercent: config?.commissionPercent ?? 10 });
}

// POST: Actualizar el porcentaje de comisión
export async function POST(request: Request) {
  const canEdit = await requireSuperAdmin();
  if (!canEdit) {
    return NextResponse.json({ error: "Solo superadmin puede actualizar comisión" }, { status: 403 });
  }

  const data = await request.json();
  const percent = Number(data.commissionPercent ?? data.commission ?? 10);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    return NextResponse.json({ error: "Porcentaje inválido" }, { status: 400 });
  }
  // Si ya existe, actualiza; si no, crea
  const config = await prisma.platformConfig.findFirst();
  if (config) {
    await prisma.platformConfig.update({
      where: { id: config.id },
      data: { commissionPercent: percent, updatedAt: new Date() },
    });
  } else {
    await prisma.platformConfig.create({
      data: { commissionPercent: percent },
    });
  }
  return NextResponse.json({ success: true, commissionPercent: percent });
}



