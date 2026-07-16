import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

async function getAdminRole(userId: string): Promise<string | null> {
  const prismaAny = prisma as any;
  const userRecord = await prismaAny.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return userRecord?.role || null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getAdminRole(user.id);
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prismaAny = prisma as any;
    const config = await prismaAny.platformConfig.findFirst({
      select: {
        pagomovilMode: true,
        pagomovilPhone: true,
        pagomovilBank: true,
        pagomovilCedula: true,
        pagomovilIdComercio: true,
        pagomovilHmacSecret: true,
        pagomovilAuthToken: true,
        pagomovilAllowedIps: true,
        pagomovilCreditoIdComercio: true,
        pagomovilCreditoHmacSecret: true,
        pagomovilCreditoAuthToken: true,
      },
    });

    return NextResponse.json({
      mode: config?.pagomovilMode || "MANUAL",
      merchant: {
        phone: config?.pagomovilPhone || "",
        bank: config?.pagomovilBank || "",
        cedula: config?.pagomovilCedula || "",
      },
      credentials: {
        idComercio: config?.pagomovilIdComercio || "",
        hmacSecret: maskSecret(config?.pagomovilHmacSecret || ""),
        authToken: maskSecret(config?.pagomovilAuthToken || ""),
        allowedIps: config?.pagomovilAllowedIps || "",
      },
      credito: {
        idComercio: config?.pagomovilCreditoIdComercio || "",
        hmacSecret: maskSecret(config?.pagomovilCreditoHmacSecret || ""),
        authToken: maskSecret(config?.pagomovilCreditoAuthToken || ""),
      },
    });
  } catch (err) {
    console.error("[admin/settings/pagomovil] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getAdminRole(user.id);
    if (role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const mode = body?.mode === "R4" ? "R4" : "MANUAL";

    const prismaAny = prisma as any;
    const existing = await prismaAny.platformConfig.findFirst();

    const updateData: Record<string, unknown> = {
      pagomovilMode: mode,
    };

    // Helper para actualizar solo si se envía en el body
    function setIfDefined(key: string, value: unknown) {
      if (value !== undefined) updateData[key] = value;
    }

    setIfDefined("pagomovilPhone", body?.merchant?.phone);
    setIfDefined("pagomovilBank", body?.merchant?.bank);
    setIfDefined("pagomovilCedula", body?.merchant?.cedula);

    setIfDefined("pagomovilIdComercio", body?.credentials?.idComercio);
    // Solo actualizar secretos si se envía un valor no enmascarado
    if (
      typeof body?.credentials?.hmacSecret === "string" &&
      !body.credentials.hmacSecret.includes("*")
    ) {
      setIfDefined("pagomovilHmacSecret", body.credentials.hmacSecret);
    }
    if (
      typeof body?.credentials?.authToken === "string" &&
      !body.credentials.authToken.includes("*")
    ) {
      setIfDefined("pagomovilAuthToken", body.credentials.authToken);
    }
    setIfDefined("pagomovilAllowedIps", body?.credentials?.allowedIps);

    setIfDefined("pagomovilCreditoIdComercio", body?.credito?.idComercio);
    if (
      typeof body?.credito?.hmacSecret === "string" &&
      !body.credito.hmacSecret.includes("*")
    ) {
      setIfDefined("pagomovilCreditoHmacSecret", body.credito.hmacSecret);
    }
    if (
      typeof body?.credito?.authToken === "string" &&
      !body.credito.authToken.includes("*")
    ) {
      setIfDefined("pagomovilCreditoAuthToken", body.credito.authToken);
    }

    if (existing) {
      await prismaAny.platformConfig.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prismaAny.platformConfig.create({
        data: {
          commissionPercent: 10,
          maintenanceMode: false,
          ...updateData,
        },
      });
    }

    return NextResponse.json({ success: true, mode });
  } catch (err) {
    console.error("[admin/settings/pagomovil] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
