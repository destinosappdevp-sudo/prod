import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const homeId = typeof body?.homeId === "string" ? body.homeId : "";
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const startDate = typeof body?.startDate === "string" ? body.startDate : "";
    const endDate = typeof body?.endDate === "string" ? body.endDate : "";
    const guests = Number(body?.guests ?? 1);
    const paymentMethod =
      typeof body?.paymentMethod === "string" ? body.paymentMethod : "";
    const paymentDetailsRaw =
      body?.paymentDetails && typeof body.paymentDetails === "object"
        ? body.paymentDetails
        : {};

    const validPaymentMethods = new Set([
      "PAGO_MOVIL",
      "ZELLE",
      "ZILLI",
      "TARJETA_INTERNACIONAL",
      "TRANSFERENCIA_BANCARIA",
    ]);

    if (!homeId || !userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan datos requeridos para completar la reserva" },
        { status: 400 }
      );
    }

    if (!validPaymentMethods.has(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pago inválido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(guests) || guests <= 0) {
      return NextResponse.json(
        { error: "Cantidad de huéspedes inválida" },
        { status: 400 }
      );
    }

    // Validar que el usuario sea el mismo que está autenticado
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startTime = start.getTime();
    const endTime = end.getTime();

    if (Number.isNaN(startTime) || Number.isNaN(endTime) || start >= end) {
      return NextResponse.json(
        { error: "Las fechas no son válidas" },
        { status: 400 }
      );
    }

    const calculatedNights = Math.ceil(
      (endTime - startTime) / (1000 * 60 * 60 * 24)
    );

    if (calculatedNights <= 0) {
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

    if (!home.price || home.price <= 0) {
      return NextResponse.json(
        { error: "La propiedad no tiene un precio válido" },
        { status: 400 }
      );
    }

    // Obtener el porcentaje de comisión actual
    let commissionPercent = 10;
    try {
      const config = await (prisma as any).platformConfig.findFirst({
        select: { commissionPercent: true },
      });
      commissionPercent =
        typeof config?.commissionPercent === "number"
          ? config.commissionPercent
          : 10;
    } catch (configError) {
      console.warn("No se pudo leer PlatformConfig en checkout:", configError);
    }

    const subtotal = home.price * calculatedNights * guests;
    const serviceFee = subtotal * (commissionPercent / 100);
    const totalAmount = subtotal; // El huésped paga solo el subtotal

    // Verificar disponibilidad (reservas activas + fechas bloqueadas por el host)
    const [conflictingReservationsCount, conflictingBlockedCount] = await Promise.all([
      (prisma as any).reservation.count({
        where: {
          homeId: homeId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startDate: { lt: end },
          endDate: { gt: start },
        },
      }),
      (prisma as any).blockedDate.count({
        where: {
          homeId: homeId,
          startDate: { lt: end },
          endDate: { gt: start },
        },
      }),
    ]);

    if (conflictingReservationsCount > 0 || conflictingBlockedCount > 0) {
      return NextResponse.json(
        { error: "Las fechas seleccionadas no están disponibles" },
        { status: 409 }
      );
    }

    const paymentDetails = paymentDetailsRaw as Record<string, any>;

    // Crear la reserva y el pago en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Crear la reserva
      const reservation = await tx.reservation.create({
        data: {
          userId,
          homeId,
          startDate: start,
          endDate: end,
          nights: calculatedNights,
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
