import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import {
  TRANSPORT_KEYS,
  getPlatformFeatures,
  type TransportKey,
} from "@/app/lib/platform-features";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

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

    const features = await getPlatformFeatures();
    return NextResponse.json(features);
  } catch (err) {
    console.error("[admin/settings/features] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
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
    const allowPrivatePackages = body?.allowPrivatePackages === true;

    const transports: Record<TransportKey, boolean> = {
      ENC32: body?.transports?.ENC32 !== false,
      VAN20: body?.transports?.VAN20 === true,
      VAN20_PASILLO: body?.transports?.VAN20_PASILLO === true,
    };
    // Al menos un transporte debe quedar activo
    if (!TRANSPORT_KEYS.some((k) => transports[k])) {
      return NextResponse.json(
        { error: "Debe haber al menos un tipo de transporte activo" },
        { status: 400 },
      );
    }

    const prismaAny = prisma as any;
    const existing = await prismaAny.platformConfig.findFirst();
    const data = {
      allowPrivatePackages,
      transportEnc32Enabled: transports.ENC32,
      transportVan20Enabled: transports.VAN20,
      transportVan20PasilloEnabled: transports.VAN20_PASILLO,
    };

    if (existing) {
      const wasAllowed = existing.allowPrivatePackages ?? false;
      await prismaAny.platformConfig.update({
        where: { id: existing.id },
        data,
      });
      // Al desactivar paquetes privados: forzar existentes a públicos
      if (wasAllowed && !allowPrivatePackages) {
        await prismaAny.home.updateMany({
          where: { isPrivate: true },
          data: { isPrivate: false, privateOwnerId: null },
        });
      }
    } else {
      await prismaAny.platformConfig.create({
        data: {
          commissionPercent: 10,
          maintenanceMode: false,
          pagomovilMode: "MANUAL",
          ...data,
        },
      });
    }

    const features = await getPlatformFeatures();
    return NextResponse.json({ success: true, ...features });
  } catch (err) {
    console.error("[admin/settings/features] PUT error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
