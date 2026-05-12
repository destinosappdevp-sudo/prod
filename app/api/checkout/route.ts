import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { currencyForPaymentMethod } from "@/app/lib/payment-currency";

type CheckoutMode = "DIRECT" | "MIXED" | "SAVINGS";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

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
    const seatId = typeof body?.seatId === "string" && body.seatId ? body.seatId : null;
    const plan = typeof body?.plan === "string" ? body.plan : null;
    const paymentMethod =
      typeof body?.paymentMethod === "string" ? body.paymentMethod : "";
    const checkoutModeRaw =
      typeof body?.checkoutMode === "string" ? body.checkoutMode : "DIRECT";
    const paymentDetailsRaw =
      body?.paymentDetails && typeof body.paymentDetails === "object"
        ? body.paymentDetails
        : {};
    const checkoutMode: CheckoutMode =
      checkoutModeRaw === "MIXED" || checkoutModeRaw === "SAVINGS"
        ? checkoutModeRaw
        : "DIRECT";

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
        { error: "Cantidad de cupos inválida" },
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
      select: { id: true, title: true, price: true, guests: true },
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
          error: `Esta propiedad admite máximo ${maxGuests} cupo${maxGuests !== 1 ? "s" : ""}.`,
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

    const hasValidBcvRate = Number.isFinite(bcvRate) && bcvRate > 0;

    if (checkoutMode !== "SAVINGS" && !hasValidBcvRate) {
      return NextResponse.json(
        { error: "No hay tasa BCV del día configurada para procesar el pago" },
        { status: 400 }
      );
    }

    const paymentCurrency = checkoutMode === "SAVINGS" ? "USD" : currencyForPaymentMethod(paymentMethod);

    const subtotalUsd = home.price * calculatedNights * guests;
    const serviceFeeUsd = subtotalUsd * (commissionPercent / 100);
    const totalAmountUsd = subtotalUsd; // El huésped paga solo el subtotal

    const subtotalBs = hasValidBcvRate ? Number((subtotalUsd * bcvRate).toFixed(2)) : 0;
    const serviceFeeBs = hasValidBcvRate ? Number((serviceFeeUsd * bcvRate).toFixed(2)) : 0;
    const totalAmountBs = hasValidBcvRate ? Number((totalAmountUsd * bcvRate).toFixed(2)) : 0;

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
    const paymentProofUrl =
      typeof paymentDetailsInput.paymentProofUrl === "string"
        ? paymentDetailsInput.paymentProofUrl
        : null;

    if (checkoutMode !== "SAVINGS") {
      if (!emisorBank || !phoneNumber || !referenceNumber || !paymentProofUrl) {
        return NextResponse.json(
          { error: "Completa los datos de Pago Móvil y adjunta la captura para continuar" },
          { status: 400 }
        );
      }
    }

    const savingsSummary = await prisma.saving.aggregate({
      where: { userId },
      _sum: { amountUsd: true },
    });
    const availableSavingsUsd = roundMoney(Number(savingsSummary._sum.amountUsd ?? 0));
    const savingsAppliedUsd =
      checkoutMode === "DIRECT"
        ? 0
        : roundMoney(Math.min(Math.max(availableSavingsUsd, 0), totalAmountUsd));
    const externalAmountUsd = roundMoney(Math.max(0, totalAmountUsd - savingsAppliedUsd));
    const savingsAppliedBs = hasValidBcvRate ? roundMoney(savingsAppliedUsd * bcvRate) : 0;
    const externalAmountBs = hasValidBcvRate ? roundMoney(externalAmountUsd * bcvRate) : 0;

    if (checkoutMode === "SAVINGS" && savingsAppliedUsd < totalAmountUsd) {
      return NextResponse.json(
        { error: "No tienes saldo suficiente en tu alcancía para cubrir este paquete" },
        { status: 400 }
      );
    }

    if (checkoutMode === "MIXED" && savingsAppliedUsd <= 0) {
      return NextResponse.json(
        { error: "No tienes saldo disponible para un pago mixto" },
        { status: 400 }
      );
    }

    // Validar asiento si fue seleccionado
    if (seatId) {
      const seat = await (prisma as any).packageSeat.findUnique({
        where: { id: seatId },
        select: { id: true, homeId: true, zone: true, status: true },
      });
      if (!seat || seat.homeId !== homeId) {
        return NextResponse.json({ error: "Asiento no válido para este paquete" }, { status: 400 });
      }
      if (seat.status === "OCCUPIED") {
        return NextResponse.json({ error: "El asiento seleccionado ya está ocupado. Por favor elige otro." }, { status: 409 });
      }
      // Validar que la zona coincida con el plan
      if (plan === "vip" && seat.zone !== "VIP") {
        return NextResponse.json({ error: "El asiento seleccionado no pertenece a la zona VIP" }, { status: 400 });
      }
      if (plan === "estandar" && seat.zone !== "STANDARD") {
        return NextResponse.json({ error: "El asiento seleccionado no pertenece a la zona Estándar" }, { status: 400 });
      }
    }

    const paymentDetails = {
      ...paymentDetailsInput,
      currency: paymentCurrency,
      checkoutMode,
      displayMethodLabel:
        checkoutMode === "SAVINGS"
          ? "Saldo de Ahorros"
          : checkoutMode === "MIXED"
          ? "Pago Mixto"
          : "Pago Móvil",
      amountUsd: Number(totalAmountUsd.toFixed(2)),
      amountBs: totalAmountBs,
      subtotalUsd: Number(subtotalUsd.toFixed(2)),
      subtotalBs,
      serviceFeeUsd: Number(serviceFeeUsd.toFixed(2)),
      serviceFeeBs,
      savingsAppliedUsd,
      savingsAppliedBs,
      externalAmountUsd,
      externalAmountBs,
      receiverMethod: checkoutMode === "SAVINGS" ? null : paymentMethod,
      paymentProofUrl: checkoutMode === "SAVINGS" ? null : paymentProofUrl,
      bcvRateUsed: hasValidBcvRate ? Number(bcvRate.toFixed(8)) : null,
      bcvRateDate: bcvRateDate ? bcvRateDate.toISOString() : null,
      paymentDate: new Date().toISOString(),
    };

    // Crear la reserva y el pago en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      const txSavingsSummary = await tx.saving.aggregate({
        where: { userId },
        _sum: { amountUsd: true },
      });
      const txAvailableSavingsUsd = roundMoney(Number(txSavingsSummary._sum.amountUsd ?? 0));
      const txSavingsAppliedUsd =
        checkoutMode === "DIRECT"
          ? 0
          : roundMoney(Math.min(Math.max(txAvailableSavingsUsd, 0), totalAmountUsd));

      if (checkoutMode === "SAVINGS" && txSavingsAppliedUsd < totalAmountUsd) {
        throw new Error("Saldo insuficiente en ahorros para completar la reserva");
      }

      if (checkoutMode === "MIXED" && txSavingsAppliedUsd <= 0) {
        throw new Error("No hay saldo disponible para aplicar a este pago mixto");
      }

      const txExternalAmountUsd = roundMoney(Math.max(0, totalAmountUsd - txSavingsAppliedUsd));
      const txSavingsAppliedBs = hasValidBcvRate ? roundMoney(txSavingsAppliedUsd * bcvRate) : 0;
      const txExternalAmountBs = hasValidBcvRate ? roundMoney(txExternalAmountUsd * bcvRate) : 0;

      // Crear la reserva
      const reservation = await tx.reservation.create({
        data: {
          userId,
          homeId,
          startDate: start,
          endDate: end,
          nights: calculatedNights,
          totalAmount: totalAmountUsd,
          status: checkoutMode === "SAVINGS" ? "CONFIRMED" : "PENDING",
          ...(seatId ? { seatId } : {}),
        },
      });

      // Marcar el asiento como OCUPADO si se seleccionó uno
      if (seatId) {
        const seatCheck = await tx.packageSeat.findUnique({
          where: { id: seatId },
          select: { status: true },
        });
        if (!seatCheck || seatCheck.status === "OCCUPIED") {
          throw new Error("El asiento ya fue ocupado por otro usuario. Por favor elige otro.");
        }
        await tx.packageSeat.update({
          where: { id: seatId },
          data: { status: "OCCUPIED" },
        });
      }

      // Crear el pago
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: paymentCurrency === "VES" ? totalAmountBs : totalAmountUsd,
          subtotal: paymentCurrency === "VES" ? subtotalBs : subtotalUsd,
          serviceFee: paymentCurrency === "VES" ? serviceFeeBs : serviceFeeUsd,
          paymentMethod,
          status: checkoutMode === "SAVINGS" ? "CONFIRMED" : "PENDING",
          bankName: checkoutMode === "SAVINGS" ? null : emisorBank,
          phoneNumber: checkoutMode === "SAVINGS" ? null : phoneNumber,
          cedula: checkoutMode === "SAVINGS" ? null : cedula,
          referenceNumber: checkoutMode === "SAVINGS" ? null : referenceNumber,
          emisorBank: checkoutMode === "SAVINGS" ? null : emisorBank,
          paymentProofUrl: checkoutMode === "SAVINGS" ? null : paymentProofUrl,
          paymentDetails: {
            ...paymentDetails,
            savingsAppliedUsd: txSavingsAppliedUsd,
            savingsAppliedBs: txSavingsAppliedBs,
            externalAmountUsd: txExternalAmountUsd,
            externalAmountBs: txExternalAmountBs,
          },
        },
      });

      if (txSavingsAppliedUsd > 0) {
        await tx.saving.create({
          data: {
            userId,
            bcvRate: hasValidBcvRate ? bcvRate : 0,
            amountUsd: -txSavingsAppliedUsd,
            amountBs: hasValidBcvRate ? -txSavingsAppliedBs : 0,
            paymentDetails: {
              kind: "CHECKOUT_DEBIT",
              checkoutMode,
              reservationId: reservation.id,
              paymentId: payment.id,
              homeId,
              homeTitle: home.title ?? null,
              amountUsd: -txSavingsAppliedUsd,
              amountBs: hasValidBcvRate ? -txSavingsAppliedBs : 0,
            },
          },
        });
      }

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
