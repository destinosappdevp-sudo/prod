import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

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
      select: { id: true, firstName: true, lastName: true, email: true, cedula: true },
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
        lastName: targetUser.lastName,
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
