import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      homeId,
      userId,
      startDate,
      endDate,
      nights,
      subtotal,
      serviceFee,
      totalAmount,
      paymentMethod,
      paymentDetails,
    } = body;

    // Validar que el usuario sea el mismo que está autenticado
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json(
        { error: "Las fechas no son válidas" },
        { status: 400 }
      );
    }

    // Verificar que la propiedad existe
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      select: { id: true, price: true },
    });

    if (!home) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 }
      );
    }

    // Verificar disponibilidad
    const conflictingReservations = await (prisma as any).reservation.findMany({
      where: {
        homeId: homeId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (conflictingReservations.length > 0) {
      return NextResponse.json(
        { error: "Las fechas seleccionadas no están disponibles" },
        { status: 409 }
      );
    }

    // Crear la reserva y el pago en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Crear la reserva
      const reservation = await tx.reservation.create({
        data: {
          userId,
          homeId,
          startDate: start,
          endDate: end,
          nights,
          totalAmount,
          status: "PENDING",
        },
      });

      // Crear el pago
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: totalAmount,
          subtotal,
          serviceFee,
          paymentMethod,
          status: "PENDING",
          bankName: paymentDetails.emisorBank || null,
          phoneNumber: paymentDetails.phoneNumber || null,
          cedula: paymentDetails.cedula || null,
          referenceNumber: paymentDetails.referenceNumber || null,
          emisorBank: paymentDetails.emisorBank || null,
          paymentDetails: paymentDetails,
        },
      });

      return { reservation, payment };
    });

    return NextResponse.json({
      success: true,
      reservationId: result.reservation.id,
      paymentId: result.payment.id,
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
