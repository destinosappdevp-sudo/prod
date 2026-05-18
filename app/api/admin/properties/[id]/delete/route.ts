import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    // Verificar que la propiedad existe
    const property = await prisma.home.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }

    // Verificar si hay reservas confirmadas
    const prismaAny = prisma as any;
    const confirmedReservations = await prismaAny.reservation.findMany({
      where: {
        homeId: id,
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    if (confirmedReservations.length > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar la propiedad. Hay ${confirmedReservations.length} reserva(s) confirmada(s).`,
        },
        { status: 400 }
      );
    }

    // Eliminar en transacción
    await prismaAny.$transaction(async (tx: any) => {
      // Eliminar favoritos
      if (tx.favorite) {
        await tx.favorite.deleteMany({ where: { homeId: id } });
      }

      // Eliminar amenidades asociadas
      if (tx.homeAmenity) {
        await tx.homeAmenity.deleteMany({ where: { homeId: id } });
      }

      // Eliminar asientos
      if (tx.packageSeat) {
        await tx.packageSeat.deleteMany({ where: { homeId: id } });
      }

      // Eliminar fechas bloqueadas
      if (tx.blockedDate) {
        await tx.blockedDate.deleteMany({ where: { homeId: id } });
      }

      // Eliminar reseñas
      if (tx.review) {
        await tx.review.deleteMany({ where: { homeId: id } });
      }

      // Eliminar reservas (solo las no confirmadas)
      if (tx.reservation) {
        await tx.reservation.deleteMany({
          where: { homeId: id, status: { not: "CONFIRMED" } },
        });
      }

      // Finalmente, eliminar la propiedad
      await tx.home.delete({ where: { id } });
    });

    return NextResponse.json(
      { message: `Propiedad "${property.title}" eliminada correctamente` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting property:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al eliminar la propiedad",
      },
      { status: 500 }
    );
  }
}
