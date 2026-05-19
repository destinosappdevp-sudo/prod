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

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
      email,
      phoneNumber,
      cedula,
      dateOfBirth,
      emergencyPhone,
      address,
      healthConditions,
      hasTraveledWithDestinos,
      lastTravelDestination,
      travelsWithChildren,
      childrenAges,
      role,
      isVerified,
      verificationStatus,
      verificationReason,
    } = body;

    const normalizedCedula = normalizeCedulaValue(cedula);
    const normalizedFullName = String(firstName ?? "").trim().replace(/\s+/g, " ");

    // Obtener datos actuales del usuario objetivo
    const targetUserCurrent = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!targetUserCurrent) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Bloquear asignación de SUPERADMIN desde la UI
    if (role === "SUPERADMIN" && targetUserCurrent.email !== "colombeiaweb@gmail.com") {
      return NextResponse.json(
        { error: "El rol SUPERADMIN solo puede asignarse a la cuenta autorizada" },
        { status: 403 }
      );
    }

    // Si el usuario ya es SUPERADMIN, no permitir cambiarle el rol
    if (targetUserCurrent.role === "SUPERADMIN") {
      body.role = "SUPERADMIN";
    }

    if (normalizedCedula) {
      const cedulaInUse = await prisma.user.findFirst({
        where: {
          cedula: {
            equals: normalizedCedula,
            mode: "insensitive",
          },
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (cedulaInUse) {
        return NextResponse.json(
          { error: "La cédula ya está registrada por otro usuario" },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      firstName: normalizedFullName || "Usuario",
      email,
      phoneNumber: phoneNumber || null,
      cedula: normalizedCedula || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      emergencyPhone: emergencyPhone || null,
      address: address || null,
      healthConditions: healthConditions || null,
      hasTraveledWithDestinos: !!hasTraveledWithDestinos,
      lastTravelDestination: hasTraveledWithDestinos ? (lastTravelDestination || null) : null,
      travelsWithChildren: !!travelsWithChildren,
      childrenAges: travelsWithChildren ? (childrenAges || null) : null,
      // Solo escribir el rol si no es SUPERADMIN protegido
      role: targetUserCurrent.role === "SUPERADMIN" ? "SUPERADMIN" : role,
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
      where: { id: userId },
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
          userId,
          publishStatus: {
            not: "APPROVED"
          }
        },
        select: { id: true },
      });

      await prisma.home.updateMany({
        where: {
          userId,
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
      where: { id: userId },
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
      where: { id: userId },
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

    let authUserId = userId;
    let { error: updateError } = await adminClient.auth.admin.updateUserById(
      userId,
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
      resolvedByEmail: authUserId !== userId,
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Error al cambiar la contraseña" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[userId] — eliminar usuario (solo SUPERADMIN)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo SUPERADMIN puede eliminar usuarios
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Solo los superadministradores pueden eliminar usuarios" },
        { status: 403 }
      );
    }

    // No puede eliminarse a sí mismo
    if (user.id === userId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // No puede eliminar a otro SUPERADMIN
    if (targetUser.role === "SUPERADMIN") {
      return NextResponse.json(
        { error: "No puedes eliminar a otro superadministrador" },
        { status: 403 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      );
    }

    // 1. Eliminar de Supabase Auth (con fallback por email si el ID no coincide)
    let { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteAuthError && targetUser.email) {
      const { authUserId: fallbackId, error: lookupError } = await findAuthUserIdByEmail(
        adminClient,
        targetUser.email
      );

      if (!lookupError && fallbackId) {
        const retry = await adminClient.auth.admin.deleteUser(fallbackId);
        deleteAuthError = retry.error;
      }
    }

    if (deleteAuthError) {
      console.error("Error eliminando de Supabase Auth:", deleteAuthError);
      // Continuar igualmente para eliminar de la BD local
    }

    // 2. Eliminar de Prisma (cascada maneja relaciones con onDelete: Cascade)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar el usuario" },
      { status: 500 }
    );
  }
}
