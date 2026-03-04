import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      ((userRecord as any).role !== "ADMIN" &&
        (userRecord as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // "confirm" o "reject"

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    // Obtener el pago con su reserva
    const payment = await prismaAny.payment.findUnique({
      where: { id: params.id },
      include: {
        Reservation: {
          include: {
            Home: {
              select: {
                title: true,
              },
            },
            User: {
              select: {
                firstName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Actualizar en transacción
    const result = await prismaAny.$transaction(async (tx: any) => {
      // Actualizar el pago
      const updatedPayment = await tx.payment.update({
        where: { id: params.id },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "REJECTED",
          confirmedAt: action === "confirm" ? new Date() : null,
        },
      });

      // Actualizar la reserva
      const updatedReservation = await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
        },
      });

      return { payment: updatedPayment, reservation: updatedReservation };
    });

    return NextResponse.json({
      success: true,
      payment: result.payment,
      reservation: result.reservation,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
