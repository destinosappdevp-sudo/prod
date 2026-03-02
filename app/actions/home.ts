"use server";

import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { logAuditAction } from "@/app/action";

/**
 * Aprueba un alojamiento pendiente (solo SUPERADMIN)
 */
export async function approveHome(homeId: string) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para aprobar alojamientos");
    }

    // Actualizar el alojamiento
    const updatedHome = await prisma.home.update({
      where: { id: homeId },
      data: {
        publishStatus: "APPROVED",
        approvedAt: new Date(),
        approvedById: user.id,
        approvalRejectionReason: null, // Limpiar razón de rechazo si había
      },
      include: {
        User: {
          select: { email: true, firstName: true },
        },
      },
    });

    // Log auditoría
    await logAuditAction(user.id, "HOME_APPROVED", {
      homeId,
      hostId: updatedHome.userId,
    });

    return { success: true, home: updatedHome };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error aprobando alojamiento:", errorMessage);
    throw error;
  }
}

/**
 * Rechaza un alojamiento pendiente (solo SUPERADMIN)
 */
export async function rejectHome(homeId: string, rejectionReason: string) {
  try {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error("Debes proporcionar una razón para rechazar el alojamiento");
    }

    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para rechazar alojamientos");
    }

    // Actualizar el alojamiento
    const updatedHome = await prisma.home.update({
      where: { id: homeId },
      data: {
        publishStatus: "REJECTED",
        approvalRejectionReason: rejectionReason,
        approvedAt: null,
        approvedById: null,
      },
      include: {
        User: {
          select: { email: true, firstName: true },
        },
      },
    });

    // Log auditoría
    await logAuditAction(user.id, "HOME_REJECTED", {
      homeId,
      hostId: updatedHome.userId,
      reason: rejectionReason,
    });

    return { success: true, home: updatedHome };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error rechazando alojamiento:", errorMessage);
    throw error;
  }
}

/**
 * Verifica un usuario HOST (solo SUPERADMIN)
 */
export async function verifyHost(hostId: string, verificationReason?: string) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para verificar anfitriones");
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: hostId },
      data: {
        isVerified: true,
        verificationStatus: "APPROVED",
        verifiedAt: new Date(),
        verificationReason: verificationReason || "Verificado por SUPERADMIN",
      },
    });

    // Log auditoría
    await logAuditAction(user.id, "HOST_VERIFIED", {
      hostId,
      reason: verificationReason,
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error verificando anfitrión:", errorMessage);
    throw error;
  }
}

/**
 * Revoca la verificación de un HOST (solo SUPERADMIN)
 */
export async function unverifyHost(hostId: string, reason?: string) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para revocar verificaciones");
    }

    // Actualizar el usuario
    const updatedUser = await prisma.user.update({
      where: { id: hostId },
      data: {
        isVerified: false,
        verificationStatus: "REJECTED",
        verifiedAt: null,
        verificationReason: reason || "Verificación revocada por SUPERADMIN",
      },
    });

    // Log auditoría
    await logAuditAction(user.id, "HOST_UNVERIFIED", {
      hostId,
      reason,
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error revocando verificación:", errorMessage);
    throw error;
  }
}

/**
 * Obtiene los alojamientos pendientes de aprobación
 */
export async function getPendingHomes(limit = 10, offset = 0) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para ver alojamientos pendientes");
    }

    const [pendingHomes, total] = await Promise.all([
      prisma.home.findMany({
        where: { publishStatus: "PENDING_APPROVAL" },
        include: {
          User: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.home.count({
        where: { publishStatus: "PENDING_APPROVAL" },
      }),
    ]);

    return {
      success: true,
      homes: pendingHomes,
      total,
      limit,
      offset,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error obteniendo alojamientos pendientes:", errorMessage);
    throw error;
  }
}

/**
 * Obtiene los hosts no verificados
 */
export async function getUnverifiedHosts(limit = 10, offset = 0) {
  try {
    const supabaseServer = await createClient();
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      throw new Error("No autenticado");
    }

    // Verificar que sea SUPERADMIN
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (adminUser?.role !== "SUPERADMIN") {
      throw new Error("No tienes permisos para ver hosts");
    }

    const [unverifiedHosts, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "HOST",
          verificationStatus: {
            in: ["NOT_SUBMITTED", "PENDING", "REJECTED"],
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          isVerified: true,
          verificationStatus: true,
          verificationReason: true,
          document1Image: true,
          document2Image: true,
          _count: {
            select: {
              Home: true,
              Reservation: true,
            },
          },
        },
        orderBy: { email: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({
        where: {
          role: "HOST",
          verificationStatus: {
            in: ["NOT_SUBMITTED", "PENDING", "REJECTED"],
          },
        },
      }),
    ]);

    return {
      success: true,
      hosts: unverifiedHosts,
      total,
      limit,
      offset,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error obteniendo hosts no verificados:", errorMessage);
    throw error;
  }
}
