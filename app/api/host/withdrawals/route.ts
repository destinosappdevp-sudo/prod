import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

// GET: historial de retiros del host + monto disponible actualizado
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prismaAny = prisma as any;

    // Monto total cobrado en reservas con endDate ya pasada
    const now = new Date();
    const confirmedPastPayments = await prismaAny.payment.aggregate({
      where: {
        status: "CONFIRMED",
        Reservation: {
          Home: { userId: user.id },
          endDate: { lt: now },
        },
      },
      _sum: { amount: true, serviceFee: true },
    });

    const totalEarned: number = confirmedPastPayments._sum.amount ?? 0;
    const totalFee: number = confirmedPastPayments._sum.serviceFee ?? 0;
    const netEarned = totalEarned - totalFee;

    // Total ya solicitado/procesado
    const withdrawnAgg = await prismaAny.withdrawalRequest.aggregate({
      where: {
        hostId: user.id,
        status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
      },
      _sum: { amount: true },
    });
    const totalWithdrawn: number = withdrawnAgg._sum.amount ?? 0;
    const availableToWithdraw = Math.max(0, netEarned - totalWithdrawn);

    const withdrawals = await prismaAny.withdrawalRequest.findMany({
      where: { hostId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      availableToWithdraw,
      totalEarned,
      totalFee,
      netEarned,
      totalWithdrawn,
      withdrawals,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: solicitar retiro de fondos
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const amount = Number(body?.amount);
    const paymentMethod = typeof body?.paymentMethod === "string" ? body.paymentMethod.trim() : "";
    const paymentDetails =
      body?.paymentDetails && typeof body.paymentDetails === "object"
        ? body.paymentDetails
        : {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ error: "Método de pago requerido" }, { status: 400 });
    }

    const prismaAny = prisma as any;
    const now = new Date();

    // Recalcular disponible para evitar solicitudes superiores al balance
    const confirmedPastPayments = await prismaAny.payment.aggregate({
      where: {
        status: "CONFIRMED",
        Reservation: {
          Home: { userId: user.id },
          endDate: { lt: now },
        },
      },
      _sum: { amount: true, serviceFee: true },
    });
    const totalEarned: number = confirmedPastPayments._sum.amount ?? 0;
    const totalFee: number = confirmedPastPayments._sum.serviceFee ?? 0;
    const netEarned = totalEarned - totalFee;

    const withdrawnAgg = await prismaAny.withdrawalRequest.aggregate({
      where: {
        hostId: user.id,
        status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
      },
      _sum: { amount: true },
    });
    const totalWithdrawn: number = withdrawnAgg._sum.amount ?? 0;
    const availableToWithdraw = Math.max(0, netEarned - totalWithdrawn);

    if (amount > availableToWithdraw + 0.01) {
      return NextResponse.json(
        { error: `El monto solicitado ($${amount.toFixed(2)}) supera el balance disponible ($${availableToWithdraw.toFixed(2)})` },
        { status: 400 }
      );
    }

    const withdrawal = await prismaAny.withdrawalRequest.create({
      data: {
        hostId: user.id,
        amount,
        paymentMethod,
        paymentDetails,
        status: "PENDING",
      },
    });

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
