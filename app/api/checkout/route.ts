import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { currencyForPaymentMethod } from "@/app/lib/payment-currency";

type CheckoutMode = "DIRECT" | "MIXED" | "SAVINGS";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizePaymentDetails(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

function getEligibleSavingsUsd(
  savingsRows: Array<{ amountUsd: number; status: string; paymentDetails: unknown }>,
  currentHomeId: string
) {
  return roundMoney(
    savingsRows.reduce((sum, row) => {
      const amountUsd = Number(row.amountUsd ?? 0);
      const details = normalizePaymentDetails(row.paymentDetails);
      const rowHomeId =
        typeof details.homeId === "string" && details.homeId.trim()
          ? details.homeId.trim()
          : null;

      if (amountUsd < 0) {
        if (!rowHomeId || rowHomeId === currentHomeId) {
          return sum + amountUsd;
        }

        return sum;
      }

      if (row.status !== "APPROVED") {
        return sum;
      }

      if (!rowHomeId || rowHomeId === currentHomeId) {
        return sum + amountUsd;
      }

      return sum;
    }, 0)
  );
}

function getWalletBreakdownUsd(
  savingsRows: Array<{ amountUsd: number; status: string; paymentDetails: unknown }>,
  currentHomeId: string
) {
  return savingsRows.reduce(
    (acc, row) => {
      const amountUsd = Number(row.amountUsd ?? 0);
      const details = normalizePaymentDetails(row.paymentDetails);
      const rowHomeId =
        typeof details.homeId === "string" && details.homeId.trim()
          ? details.homeId.trim()
          : null;

      if (amountUsd < 0) {
        if (!rowHomeId) {
          acc.general = roundMoney(acc.general + amountUsd);
        } else if (rowHomeId === currentHomeId) {
          acc.currentPackage = roundMoney(acc.currentPackage + amountUsd);
        }
        return acc;
      }

      if (row.status !== "APPROVED") {
        return acc;
      }

      if (!rowHomeId) {
        acc.general = roundMoney(acc.general + amountUsd);
      } else if (rowHomeId === currentHomeId) {
        acc.currentPackage = roundMoney(acc.currentPackage + amountUsd);
      }

      return acc;
    },
    { general: 0, currentPackage: 0 }
  );
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
    const seatIdsInput = Array.isArray(body?.seatIds)
      ? body.seatIds
      : typeof body?.seatIds === "string"
      ? body.seatIds.split(",")
      : [];
    const selectedSeatIds = Array.from(
      new Set(
        seatIdsInput
          .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      )
    );
    if (selectedSeatIds.length === 0 && seatId) {
      selectedSeatIds.push(seatId);
    }
    const planParam = typeof body?.plan === "string" ? body.plan : "estandar";
    const plan: "vip" | "estandar" = planParam === "vip" ? "vip" : "estandar";
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
      select: { id: true, title: true, price: true, priceVip: true, guests: true },
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

    if (plan === "vip") {
      if (!home.priceVip || home.priceVip <= 0) {
        return NextResponse.json(
          { error: "Este paquete no tiene precio VIP configurado" },
          { status: 400 }
        );
      }
    } else if (!home.price || home.price <= 0) {
      return NextResponse.json(
        { error: "Este paquete no tiene precio Estándar configurado" },
        { status: 400 }
      );
    }

    // Regla de negocio: un usuario no puede reservar el mismo viaje más de una vez.
    const existingUserReservation = await (prisma as any).reservation.findFirst({
      where: {
        userId,
        homeId,
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });

    if (existingUserReservation) {
      const isPaidReservation =
        existingUserReservation.status === "CONFIRMED" ||
        existingUserReservation.status === "COMPLETED";

      return NextResponse.json(
        {
          error: isPaidReservation
            ? "Ya pagaste este viaje y no puedes comprarlo nuevamente"
            : "Ya tienes una reserva en proceso para este viaje",
          reservationId: existingUserReservation.id,
        },
        { status: 409 }
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

    const selectedUnitPrice = plan === "vip" ? Number(home.priceVip) : Number(home.price);
    const subtotalUsd = selectedUnitPrice * calculatedNights * guests;
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

    // Solo contar ahorros APROBADOS para el saldo disponible
    const savingsRows = await (prisma as any).saving.findMany({
      where: { userId },
      select: { amountUsd: true, status: true, paymentDetails: true },
    });
    const availableSavingsUsd = roundMoney(
      savingsRows.reduce((sum: number, s: any) => {
        const usd = Number(s.amountUsd ?? 0);
        if (usd < 0) return sum + usd;
        return s.status === "APPROVED" ? sum + usd : sum;
      }, 0)
    );
    const eligibleSavingsUsd = getEligibleSavingsUsd(
      savingsRows as Array<{ amountUsd: number; status: string; paymentDetails: unknown }>,
      homeId
    );
    const savingsAppliedUsd =
      checkoutMode === "DIRECT"
        ? 0
        : roundMoney(Math.min(Math.max(eligibleSavingsUsd, 0), totalAmountUsd));
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
        {
          error:
            "No tienes saldo disponible en ahorros generales o en este paquete para un pago mixto",
        },
        { status: 400 }
      );
    }

    if (selectedSeatIds.length > 0 && selectedSeatIds.length !== guests) {
      return NextResponse.json(
        { error: "Debes seleccionar un asiento por cada pasajero." },
        { status: 400 }
      );
    }

    // Validar asientos seleccionados
    if (selectedSeatIds.length > 0) {
      const selectedSeats = await (prisma as any).packageSeat.findMany({
        where: { id: { in: selectedSeatIds } },
        select: { id: true, homeId: true, zone: true, status: true },
      });

      if (selectedSeats.length !== selectedSeatIds.length) {
        return NextResponse.json(
          { error: "Uno o más asientos no son válidos para este paquete" },
          { status: 400 }
        );
      }

      for (const seat of selectedSeats) {
        if (seat.homeId !== homeId) {
          return NextResponse.json({ error: "Asiento no válido para este paquete" }, { status: 400 });
        }

        if (seat.status === "OCCUPIED") {
          return NextResponse.json({ error: "Uno de los asientos seleccionados ya está ocupado. Por favor elige otro." }, { status: 409 });
        }

        if (plan === "vip" && seat.zone !== "VIP") {
          return NextResponse.json({ error: "Uno de los asientos no pertenece a la zona VIP" }, { status: 400 });
        }

        if (plan === "estandar" && seat.zone !== "STANDARD") {
          return NextResponse.json({ error: "Uno de los asientos no pertenece a la zona Estándar" }, { status: 400 });
        }
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
      seatIds: selectedSeatIds,
      receiverMethod: checkoutMode === "SAVINGS" ? null : paymentMethod,
      paymentProofUrl: checkoutMode === "SAVINGS" ? null : paymentProofUrl,
      bcvRateUsed: hasValidBcvRate ? Number(bcvRate.toFixed(8)) : null,
      bcvRateDate: bcvRateDate ? bcvRateDate.toISOString() : null,
      paymentDate: new Date().toISOString(),
    };

    // Crear la reserva y el pago en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Solo contar ahorros APROBADOS dentro de la transacción
      const txSavingsRows = await tx.saving.findMany({
        where: { userId },
        select: { amountUsd: true, status: true, paymentDetails: true },
      });
      const txEligibleSavingsUsd = getEligibleSavingsUsd(
        txSavingsRows as Array<{ amountUsd: number; status: string; paymentDetails: unknown }>,
        homeId
      );
      const txWallets = getWalletBreakdownUsd(
        txSavingsRows as Array<{ amountUsd: number; status: string; paymentDetails: unknown }>,
        homeId
      );
      const txSavingsAppliedUsd =
        checkoutMode === "DIRECT"
          ? 0
          : roundMoney(Math.min(Math.max(txEligibleSavingsUsd, 0), totalAmountUsd));

      if (checkoutMode === "SAVINGS" && txSavingsAppliedUsd < totalAmountUsd) {
        throw new Error("Saldo insuficiente en ahorros para completar la reserva");
      }

      if (checkoutMode === "MIXED" && txSavingsAppliedUsd <= 0) {
        throw new Error(
          "No hay saldo disponible en ahorros generales o en este paquete para aplicar a este pago mixto"
        );
      }

      const txExternalAmountUsd = roundMoney(Math.max(0, totalAmountUsd - txSavingsAppliedUsd));
      const txSavingsAppliedBs = hasValidBcvRate ? roundMoney(txSavingsAppliedUsd * bcvRate) : 0;
      const txExternalAmountBs = hasValidBcvRate ? roundMoney(txExternalAmountUsd * bcvRate) : 0;
      const packageWalletUsd = Math.max(0, roundMoney(txWallets.currentPackage));
      const generalWalletUsd = Math.max(0, roundMoney(txWallets.general));
      const packageDebitUsd = roundMoney(Math.min(packageWalletUsd, txSavingsAppliedUsd));
      const generalDebitUsd = roundMoney(Math.min(generalWalletUsd, Math.max(0, txSavingsAppliedUsd - packageDebitUsd)));

      // Crear la reserva siempre en PENDING para revisión manual del pago.
      const reservationStatus: string = "PENDING";

      const reservation = await tx.reservation.create({
        data: {
          userId,
          homeId,
          startDate: start,
          endDate: end,
          nights: calculatedNights,
          totalAmount: totalAmountUsd,
          status: reservationStatus,
          ...(selectedSeatIds[0] ? { seatId: selectedSeatIds[0] } : {}),
        },
      });

      // Marcar asientos como OCUPADOS si se seleccionaron
      if (selectedSeatIds.length > 0) {
        const occupied = await tx.packageSeat.updateMany({
          where: {
            id: { in: selectedSeatIds },
            status: "AVAILABLE",
          },
          data: { status: "OCCUPIED" },
        });

        if (occupied.count !== selectedSeatIds.length) {
          throw new Error("Uno de los asientos ya fue ocupado por otro usuario. Por favor elige otro.");
        }
      }

      // Crear el pago siempre en PENDING para evitar aprobaciones automáticas.
      const paymentStatus: string = "PENDING";

      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: paymentCurrency === "VES" ? totalAmountBs : totalAmountUsd,
          subtotal: paymentCurrency === "VES" ? subtotalBs : subtotalUsd,
          serviceFee: paymentCurrency === "VES" ? serviceFeeBs : serviceFeeUsd,
          paymentMethod,
          status: paymentStatus,
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
        if (packageDebitUsd > 0) {
          await tx.saving.create({
            data: {
              userId,
              bcvRate: hasValidBcvRate ? bcvRate : 0,
              amountUsd: -packageDebitUsd,
              amountBs: hasValidBcvRate ? -roundMoney(packageDebitUsd * bcvRate) : 0,
              paymentDetails: {
                kind: "CHECKOUT_DEBIT",
                checkoutMode,
                reservationId: reservation.id,
                paymentId: payment.id,
                homeId,
                homeTitle: home.title ?? null,
                seatIds: selectedSeatIds,
                amountUsd: -packageDebitUsd,
                amountBs: hasValidBcvRate ? -roundMoney(packageDebitUsd * bcvRate) : 0,
                sourceWallet: "PACKAGE",
              },
            },
          });
        }

        if (generalDebitUsd > 0) {
          await tx.saving.create({
            data: {
              userId,
              bcvRate: hasValidBcvRate ? bcvRate : 0,
              amountUsd: -generalDebitUsd,
              amountBs: hasValidBcvRate ? -roundMoney(generalDebitUsd * bcvRate) : 0,
              paymentDetails: {
                kind: "CHECKOUT_DEBIT",
                checkoutMode,
                reservationId: reservation.id,
                paymentId: payment.id,
                homeId: null,
                homeTitle: null,
                targetHomeId: homeId,
                targetHomeTitle: home.title ?? null,
                seatIds: selectedSeatIds,
                amountUsd: -generalDebitUsd,
                amountBs: hasValidBcvRate ? -roundMoney(generalDebitUsd * bcvRate) : 0,
                sourceWallet: "GENERAL",
              },
            },
          });
        }
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



