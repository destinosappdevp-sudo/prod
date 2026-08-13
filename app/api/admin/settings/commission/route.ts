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

// GET: Obtener el porcentaje de comisión actual (siempre 0% ya que no existe comisión)
export async function GET() {
  return NextResponse.json({ commissionPercent: 0 });
}

// POST: Actualizar el porcentaje de comisión (siempre se mantiene en 0%)
export async function POST(request: Request) {
  const canEdit = await requireSuperAdmin();
  if (!canEdit) {
    return NextResponse.json({ error: "Solo superadmin puede actualizar comisión" }, { status: 403 });
  }

  return NextResponse.json({ success: true, commissionPercent: 0 });
}



