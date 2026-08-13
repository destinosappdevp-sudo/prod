import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { enviarCreditoInmediato } from "@/app/lib/r4-credito";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

function normalizePaymentDetails(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

async function getAdminRole(userId: string): Promise<string | null> {
  const prismaAny = prisma as any;
  const userRecord = await prismaAny.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return userRecord?.role || null;
}

export async function PATCH() {
  return NextResponse.json(
    { error: "La funcionalidad de procesamiento de retiros ya no está disponible en la plataforma" },
    { status: 410 }
  );
}
