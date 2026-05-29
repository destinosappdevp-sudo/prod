import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: homeId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !adminUser ||
      ((adminUser as any).role !== "ADMIN" && (adminUser as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const cedula = normalizeCedulaValue(body?.cedula);
    const seatId = typeof body?.seatId === "string" ? body.seatId.trim() : "";
    const plan = body?.plan === "vip" ? "vip" : "estandar";
    const guests = Number(body?.guests ?? 1);
    const reservationMode = body?.reservationMode === "saving" ? "saving" : "cash";
    const savingDepositUsd = Number(body?.savingDepositUsd ?? 0);
    const savingStartedAtRaw =
      typeof body?.savingStartedAt === "string" ? body.savingStartedAt.trim() : "";

    const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const emisorBank = typeof body?.emisorBank === "string" ? body.emisorBank.trim() : "";
    const referenceNumber =
      typeof body?.referenceNumber === "string" ? body.referenceNumber.trim() : "";
    const payerCedula = normalizeCedulaValue(body?.payerCedula);
    const observations =
      typeof body?.observations === "string" ? body.observations.trim() : "";

    if (!cedula) {
      return NextResponse.json({ error: "La cédula del usuario es requerida" }, { status: 400 });
    }

    if (!seatId) {
      return NextResponse.json({ error: "Debes seleccionar un asiento" }, { status: 400 });
    }

    if (!Number.isInteger(guests) || guests <= 0) {
      return NextResponse.json({ error: "Cantidad de cupos inválida" }, { status: 400 });
    }

    if (reservationMode === "saving") {
      if (!Number.isFinite(savingDepositUsd) || savingDepositUsd <= 0) {
        return NextResponse.json(
          { error: "Debes indicar un monto de abono válido" },
          { status: 400 }
        );
      }

      if (!savingStartedAtRaw) {
        return NextResponse.json(
          { error: "Debes indicar la fecha de inicio del ahorro" },
          { status: 400 }
        );
      }
    }

    if (!phoneNumber || !emisorBank || !referenceNumber || !payerCedula) {
      return NextResponse.json(
        {
          error:
            "Completa los datos de Pago Móvil (teléfono, banco, referencia y cédula pagador)",
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        cedula: {
          equals: cedula,
          mode: "insensitive",
        },
      },
      select: { id: true, firstName: true, email: true, cedula: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const home = await prisma.home.findUnique({
      where: { id: homeId },
      select: {
        id: true,
        title: true,
        price: true,
        priceVip: true,
        checkInTime: true,
      },
    });

    if (!home) {
      return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
    }

    const seatsCount = await (prisma as any).packageSeat.count({
      where: { homeId },
    });

    if (seatsCount > 0 && !seatId) {
      return NextResponse.json({ error: "Debes seleccionar un asiento" }, { status: 400 });
    }

    const seat = await (prisma as any).packageSeat.findUnique({
      where: { id: seatId },
      select: { id: true, homeId: true, zone: true, status: true },
    });

    if (!seat || seat.homeId !== homeId) {
      return NextResponse.json({ error: "Asiento no válido para este paquete" }, { status: 400 });
    }

    if (seat.status === "OCCUPIED") {
      return NextResponse.json({ error: "El asiento ya está ocupado" }, { status: 409 });
    }

    if (plan === "vip" && seat.zone !== "VIP") {
      return NextResponse.json({ error: "El asiento no pertenece a la zona VIP" }, { status: 400 });
    }

    if (plan === "estandar" && seat.zone !== "STANDARD") {
      return NextResponse.json(
        { error: "El asiento no pertenece a la zona Estándar" },
        { status: 400 }
      );
    }

    const unitPrice =
      plan === "vip" && typeof home.priceVip === "number" && home.priceVip > 0
        ? home.priceVip
        : home.price;

    if (!unitPrice || unitPrice <= 0) {
      return NextResponse.json({ error: "El paquete no tiene un precio válido" }, { status: 400 });
    }

    const startDate = safeDate(home.checkInTime) ?? new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const totalAmount = Number((unitPrice * guests).toFixed(2));

    if (reservationMode === "saving") {
      if (savingDepositUsd >= totalAmount) {
        return NextResponse.json(
          {
            error:
              "El abono inicial debe ser menor al monto total. Si ya tienes el total, usa Pagar de contado.",
          },
          { status: 400 }
        );
      }

      const savingDate = safeDate(`${savingStartedAtRaw}T12:00:00`);
      if (!savingDate) {
        return NextResponse.json({ error: "Fecha de abono inválida" }, { status: 400 });
      }

      const existingPaidReservation = await (prisma as any).reservation.findFirst({
        where: {
          userId: targetUser.id,
          homeId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
        select: { id: true },
      });

      if (existingPaidReservation) {
        return NextResponse.json(
          { error: "Este usuario ya tiene una reserva confirmada para este paquete" },
          { status: 409 }
        );
      }

      const config = await (prisma as any).platformConfig.findFirst({
        select: { bcvRate: true },
      });
      const bcvRate = Number(config?.bcvRate ?? 0);
      if (!bcvRate || bcvRate <= 0) {
        return NextResponse.json({ error: "Tasa BCV no disponible" }, { status: 400 });
      }

      const approvedDeposits = await (prisma as any).saving.findMany({
        where: {
          userId: targetUser.id,
          status: "APPROVED",
          amountUsd: { gt: 0 },
        },
        select: { amountUsd: true, paymentDetails: true },
      });

      const approvedPackageUsd = roundMoney(
        approvedDeposits.reduce((sum: number, row: any) => {
          const details = row.paymentDetails && typeof row.paymentDetails === "object"
            ? (row.paymentDetails as Record<string, any>)
            : {};
          const rowHomeId = typeof details.homeId === "string" ? details.homeId : null;
          if (rowHomeId !== homeId) return sum;
          return sum + Number(row.amountUsd ?? 0);
        }, 0)
      );

      const remainingUsd = roundMoney(Math.max(totalAmount - approvedPackageUsd, 0));
      if (remainingUsd <= 0) {
        return NextResponse.json(
          {
            error:
              "Este usuario ya completó el ahorro para este paquete. Usa pago de contado o revisa su reserva.",
          },
          { status: 400 }
        );
      }

      if (savingDepositUsd > remainingUsd) {
        return NextResponse.json(
          {
            error: `El abono supera el saldo pendiente (${remainingUsd.toFixed(2)} USD).`,
          },
          { status: 400 }
        );
      }

      const depositUsd = roundMoney(savingDepositUsd);
      const depositBs = roundMoney(depositUsd * bcvRate);

      const result = await (prisma as any).$transaction(async (tx: any) => {
        const seatCheck = await tx.packageSeat.findUnique({
          where: { id: seatId },
          select: { status: true, homeId: true },
        });

        if (!seatCheck || seatCheck.homeId !== homeId) {
          throw new Error("Asiento no válido para este paquete");
        }

        if (seatCheck.status === "OCCUPIED") {
          throw new Error("El asiento fue ocupado por otro usuario");
        }

        const updatedSeat = await tx.packageSeat.updateMany({
          where: { id: seatId, homeId, status: "AVAILABLE" },
          data: { status: "OCCUPIED" },
        });

        if (updatedSeat.count !== 1) {
          throw new Error("El asiento fue ocupado por otro usuario");
        }

        const saving = await tx.saving.create({
          data: {
            userId: targetUser.id,
            amountUsd: depositUsd,
            amountBs: depositBs,
            bcvRate,
            status: "APPROVED",
            date: savingDate,
            paymentDetails: {
              kind: "PACKAGE_SAVING_DEPOSIT",
              createdByAdmin: true,
              approvedBySystem: true,
              approvedAt: new Date().toISOString(),
              soldByAdminId: user.id,
              soldAt: new Date().toISOString(),
              homeId,
              homeTitle: home.title,
              plan,
              guests,
              seatId,
              seatIds: [seatId],
              amountUsd: depositUsd,
              amountBs: depositBs,
              phoneNumber,
              emisorBank,
              referenceNumber,
              payerCedula,
              adminObservations: observations || null,
              startedSavingAt: savingDate.toISOString(),
              startedFromAdminReserveTab: true,
            },
          },
        });

        return { saving };
      });

      return NextResponse.json({
        success: true,
        mode: "saving",
        savingId: result.saving.id,
        user: {
          id: targetUser.id,
          firstName: targetUser.firstName,
          email: targetUser.email,
          cedula: targetUser.cedula,
        },
      });
    }

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const seatCheck = await tx.packageSeat.findUnique({
        where: { id: seatId },
        select: { status: true },
      });

      if (!seatCheck || seatCheck.status === "OCCUPIED") {
        throw new Error("El asiento fue ocupado por otro usuario");
      }

      const reservation = await tx.reservation.create({
        data: {
          userId: targetUser.id,
          homeId,
          startDate,
          endDate,
          nights: 1,
          totalAmount,
          status: "CONFIRMED",
          seatId,
        },
      });

      await tx.packageSeat.update({
        where: { id: seatId },
        data: { status: "OCCUPIED" },
      });

      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: totalAmount,
          subtotal: totalAmount,
          serviceFee: 0,
          paymentMethod: "PAGO_MOVIL",
          status: "CONFIRMED",
          confirmedAt: new Date(),
          bankName: emisorBank,
          phoneNumber,
          cedula: payerCedula,
          referenceNumber,
          emisorBank,
          paymentDetails: {
            kind: "ADMIN_MANUAL_SALE",
            homeId,
            homeTitle: home.title,
            plan,
            guests,
            adminObservations: observations || null,
            soldByAdminId: user.id,
            soldAt: new Date().toISOString(),
          },
        },
      });

      return { reservation, payment };
    });

    return NextResponse.json({
      success: true,
      reservationId: result.reservation.id,
      paymentId: result.payment.id,
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        email: targetUser.email,
        cedula: targetUser.cedula,
      },
    });
  } catch (error) {
    console.error("Error creando reserva manual:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
