import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const prismaAny = prisma as any;
    const config = await prismaAny.platformConfig.findFirst({
      select: { maintenanceMode: true },
    });

    const maintenanceMode = config?.maintenanceMode ?? false;

    // Si mantenimiento está activo, verificar si el user actual es admin
    let isAdmin = false;
    if (maintenanceMode) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const record = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          isAdmin = record?.role === "ADMIN" || record?.role === "SUPERADMIN";
        }
      } catch {
        isAdmin = false;
      }
    }

    return NextResponse.json(
      { maintenanceMode, isAdmin },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json({ maintenanceMode: false, isAdmin: false });
  }
}
