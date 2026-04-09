import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  revalidateHomeVisibilityPaths,
  syncHomeVisibilityFlags,
} from "@/app/lib/home-visibility";

export const dynamic = "force-dynamic";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

async function findAuthUserIdByEmail(adminClient: AdminClient, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

    if (error) {
      return { authUserId: null, error };
    }

    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === normalizedEmail);

    if (match) {
      return { authUserId: match.id, error: null };
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return { authUserId: null, error: null };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario sea admin o superadmin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      role,
      isVerified,
      verificationStatus,
      verificationReason,
    } = body;

    // Preparar datos de actualización
    const updateData: any = {
      firstName,
      lastName,
      email,
      role,
      verificationStatus,
      verificationReason,
    };

    // Si se está cambiando isVerified
    if (typeof isVerified === "boolean") {
      updateData.isVerified = isVerified;
      
      // Si se verifica por primera vez, establecer verifiedAt
      if (isVerified) {
        updateData.verifiedAt = new Date();
        updateData.verificationStatus = "APPROVED";
      } else {
        updateData.verifiedAt = null;
      }
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      include: {
        _count: {
          select: {
            Home: true,
            Favorite: true,
            Reservation: true,
          },
        },
      },
    });

    // Si se aprueba un host, aprobar automáticamente todas sus propiedades
    const hostApproved = (
      (isVerified === true || verificationStatus === "APPROVED") && 
      (updatedUser.role === "SUPERADMIN" || role === "SUPERADMIN" || updatedUser.role === "ADMIN" || role === "ADMIN")
    );
    
    if (hostApproved) {
      const homesToApprove = await prisma.home.findMany({
        where: {
          userId: params.userId,
          publishStatus: {
            not: "APPROVED"
          }
        },
        select: { id: true },
      });

      await prisma.home.updateMany({
        where: {
          userId: params.userId,
          publishStatus: {
            not: "APPROVED"
          }
        },
        data: {
          publishStatus: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });

      for (const home of homesToApprove) {
        await syncHomeVisibilityFlags(home.id);
        revalidateHomeVisibilityPaths(home.id);
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario sea admin o superadmin
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        _count: {
          select: {
            Home: true,
            Favorite: true,
            Reservation: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[userId] — cambiar contraseña
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const { password } = await req.json();

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    let authUserId = params.userId;
    let { error: updateError } = await adminClient.auth.admin.updateUserById(
      params.userId,
      { password }
    );

    // Fallback para datos legacy: si el ID local no existe en Supabase Auth,
    // intentamos localizar al usuario por email y volver a aplicar el cambio.
    if (updateError && targetUser.email) {
      const { authUserId: fallbackAuthUserId, error: lookupError } = await findAuthUserIdByEmail(
        adminClient,
        targetUser.email
      );

      if (lookupError) {
        console.error("Supabase lookup error:", lookupError);
        return NextResponse.json(
          {
            error: "Error al verificar el usuario en autenticación",
            details: lookupError.message,
          },
          { status: 500 }
        );
      }

      if (fallbackAuthUserId) {
        authUserId = fallbackAuthUserId;
        const retry = await adminClient.auth.admin.updateUserById(fallbackAuthUserId, { password });
        updateError = retry.error;
      }
    }

    if (updateError) {
      console.error("Supabase error:", updateError);
      return NextResponse.json(
        {
          error: "Error al cambiar la contraseña",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      authUserId,
      resolvedByEmail: authUserId !== params.userId,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}
