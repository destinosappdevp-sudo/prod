import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { currencyForPaymentMethod } from "@/app/lib/payment-currency";

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
      select: { id: true, price: true, guests: true },
    });

    if (!home) {
      return NextResponse.json(
        { error: "Propiedad no encontrada" },
        { status: 404 }
      );
    }

    const maxGuests = home.guests ? parseInt(home.guests as string, 10) : null;
    if (maxGuests && maxGuests > 0 && guests > maxGuests) {
      return NextResponse.json(
        {
          error: `Esta propiedad admite máximo ${maxGuests} huésped${maxGuests !== 1 ? "es" : ""}.`,
        },
        { status: 400 }
      );
    }

    if (!home.price || home.price <= 0) {
      return NextResponse.json(
        { error: "La propiedad no tiene un precio válido" },
        { status: 400 }
      );
    }

    // Obtener configuración actual de comisión y tasa BCV
    let commissionPercent = 10;
    let bcvRate = 0;
    let bcvRateDate: Date | null = null;
    try {
      const config = await (prisma as any).platformConfig.findFirst({
        select: {
          commissionPercent: true,
          bcvRate: true,
          bcvRateDate: true,
        },
      });

      commissionPercent =
        typeof config?.commissionPercent === "number"
          ? config.commissionPercent
          : 10;

      bcvRate = config?.bcvRate ? Number(config.bcvRate) : 0;
      bcvRateDate = config?.bcvRateDate ? new Date(config.bcvRateDate) : null;
    } catch (configError) {
      console.warn("No se pudo leer PlatformConfig en checkout:", configError);
    }

    const paymentCurrency = currencyForPaymentMethod(paymentMethod);

    if (paymentCurrency === "VES" && (!Number.isFinite(bcvRate) || bcvRate <= 0)) {
      return NextResponse.json(
        { error: "No hay tasa BCV del día configurada para procesar el pago" },
        { status: 400 }
      );
    }

    const subtotalUsd = home.price * calculatedNights * guests;
    const serviceFeeUsd = subtotalUsd * (commissionPercent / 100);
    const totalAmountUsd = subtotalUsd; // El huésped paga solo el subtotal

    const subtotalBs = Number((subtotalUsd * bcvRate).toFixed(2));
    const serviceFeeBs = Number((serviceFeeUsd * bcvRate).toFixed(2));
    const totalAmountBs = Number((totalAmountUsd * bcvRate).toFixed(2));

    const paymentSubtotal = paymentCurrency === "VES" ? subtotalBs : subtotalUsd;
    const paymentServiceFee = paymentCurrency === "VES" ? serviceFeeBs : serviceFeeUsd;
    const paymentAmount = paymentCurrency === "VES" ? totalAmountBs : totalAmountUsd;

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

    const paymentDetailsInput = paymentDetailsRaw as Record<string, any>;
    const emisorBank =
      typeof paymentDetailsInput.emisorBank === "string"
        ? paymentDetailsInput.emisorBank
        : null;
    const phoneNumber =
      typeof paymentDetailsInput.phoneNumber === "string"
        ? paymentDetailsInput.phoneNumber
        : null;
    const cedula =
      typeof paymentDetailsInput.cedula === "string"
        ? paymentDetailsInput.cedula
        : null;
    const referenceNumber =
      typeof paymentDetailsInput.referenceNumber === "string"
        ? paymentDetailsInput.referenceNumber
        : null;

    const paymentDetails = {
      ...paymentDetailsInput,
      currency: paymentCurrency,
      amountUsd: Number(totalAmountUsd.toFixed(2)),
      amountBs: totalAmountBs,
      subtotalUsd: Number(subtotalUsd.toFixed(2)),
      subtotalBs,
      serviceFeeUsd: Number(serviceFeeUsd.toFixed(2)),
      serviceFeeBs,
      bcvRateUsed: Number(bcvRate.toFixed(8)),
      bcvRateDate: bcvRateDate ? bcvRateDate.toISOString() : null,
      paymentDate: new Date().toISOString(),
    };

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
          totalAmount: totalAmountUsd,
          status: "PENDING",
        },
      });

      // Crear el pago
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: paymentAmount,
          subtotal: paymentSubtotal,
          serviceFee: paymentServiceFee,
          paymentMethod,
          status: "PENDING",
          bankName: emisorBank,
          phoneNumber,
          cedula,
          referenceNumber,
          emisorBank,
          paymentDetails: paymentDetails,
        },
      });

      return { reservation, payment };
    });

    return NextResponse.json({
      success: true,
      reservationId: result.reservation.id,
      paymentId: result.payment.id,
      totalAmountBs,
      totalAmountUsd: Number(totalAmountUsd.toFixed(2)),
      paymentCurrency,
      bcvRateUsed: Number(bcvRate.toFixed(8)),
    });
  } catch (error) {
    console.error("Error en checkout:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
