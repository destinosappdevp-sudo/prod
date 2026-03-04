import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      (updatedUser.role === "HOST" || role === "HOST")
    );
    
    if (hostApproved) {
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
