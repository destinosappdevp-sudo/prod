import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea SUPERADMIN
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || userRecord.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Solo superadmins pueden sincronizar usuarios" },
        { status: 403 }
      );
    }

    // Crear cliente admin de Supabase usando la service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltan credenciales de administrador en el servidor" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

    // Obtener todos los usuarios de auth.users
    const { data: { users: authUsers }, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: `Error listando auth.users: ${listError.message}` },
        { status: 500 }
      );
    }

    let synced = 0;
    let skipped = 0;
    const synchronized: any[] = [];

    // Por cada usuario en auth.users, verificar si existe en public."User"
    for (const authUser of authUsers || []) {
      const existingUser = await prisma.user.findUnique({
        where: { id: authUser.id },
      });

      if (!existingUser) {
        // No existe en public."User", crearlo
        const newUser = await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email || "",
            firstName:
              authUser.user_metadata?.fullName ||
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.firstName ||
              "Usuario",
            profileImage: authUser.user_metadata?.profileImage || null,
            role: "GUEST", // Role por defecto para sincronizados
            phoneNumber: authUser.user_metadata?.phoneNumber || null,
            isVerified: false,
            verificationReason: null,
            verifiedAt: null,
            stateCode: null,
          },
        });

        synchronized.push({
          id: authUser.id,
          email: authUser.email,
          action: "created",
        });
        synced++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sincronización completada. ${synced} usuarios creados, ${skipped} ya existían.`,
        synced,
        skipped,
        total: authUsers?.length || 0,
        synchronized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error syncing users:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al sincronizar usuarios: ${errorMessage}` },
      { status: 500 }
    );
  }
}



