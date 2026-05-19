import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import {
  getCurrencySymbol,
  parsePaymentFinancials,
  WalletCurrency,
} from "@/app/lib/payment-currency";

type WalletBalance = {
  totalEarned: number;
  totalFee: number;
  netEarned: number;
  totalWithdrawn: number;
  availableToWithdraw: number;
};

const CURRENCIES: WalletCurrency[] = ["USD", "VES"];

function createEmptyWallet(): WalletBalance {
  return {
    totalEarned: 0,
    totalFee: 0,
    netEarned: 0,
    totalWithdrawn: 0,
    availableToWithdraw: 0,
  };
}

function getWithdrawalCurrency(paymentDetails: unknown): WalletCurrency {
  if (!paymentDetails || typeof paymentDetails !== "object") {
    return "USD";
  }

  const currency = (paymentDetails as Record<string, unknown>).currency;
  return currency === "VES" ? "VES" : "USD";
}

async function calculateWallets(userId: string) {
  const prismaAny = prisma as any;
  const now = new Date();

  const [confirmedPastPayments, withdrawnRows] = await Promise.all([
    prismaAny.payment.findMany({
      where: {
        status: "CONFIRMED",
        Reservation: {
          Home: { userId },
          endDate: { lt: now },
        },
      },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    }),
    prismaAny.withdrawalRequest.findMany({
      where: {
        hostId: userId,
        status: { in: ["PENDING", "PROCESSING", "COMPLETED"] },
      },
      select: {
        amount: true,
        paymentDetails: true,
      },
    }),
  ]);

  const wallets: Record<WalletCurrency, WalletBalance> = {
    USD: createEmptyWallet(),
    VES: createEmptyWallet(),
  };

  for (const payment of confirmedPastPayments) {
    const parsed = parsePaymentFinancials({
      amount: payment.amount ?? 0,
      subtotal: payment.subtotal ?? 0,
      serviceFee: payment.serviceFee ?? 0,
      paymentMethod: payment.paymentMethod,
      paymentDetails: payment.paymentDetails,
    });

    wallets[parsed.currency].totalEarned += parsed.amount;
    wallets[parsed.currency].totalFee += parsed.serviceFee;
  }

  for (const currency of CURRENCIES) {
    wallets[currency].netEarned = Number(
      (wallets[currency].totalEarned - wallets[currency].totalFee).toFixed(2)
    );
  }

  for (const withdrawal of withdrawnRows) {
    const currency = getWithdrawalCurrency(withdrawal.paymentDetails);
    wallets[currency].totalWithdrawn += withdrawal.amount ?? 0;
  }

  for (const currency of CURRENCIES) {
    wallets[currency].availableToWithdraw = Number(
      Math.max(
        0,
        wallets[currency].netEarned - wallets[currency].totalWithdrawn
      ).toFixed(2)
    );
  }

  return wallets;
}

// GET: historial de retiros del host + monto disponible actualizado
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const prismaAny = prisma as any;
    const wallets = await calculateWallets(user.id);

    const withdrawals = await prismaAny.withdrawalRequest.findMany({
      where: { hostId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const withdrawalsWithCurrency = withdrawals.map((withdrawal: any) => ({
      ...withdrawal,
      currency: getWithdrawalCurrency(withdrawal.paymentDetails),
    }));

    return NextResponse.json({
      wallets,
      // Compatibilidad con clientes antiguos que asumían solo USD.
      availableToWithdraw: wallets.USD.availableToWithdraw,
      totalEarned: wallets.USD.totalEarned,
      totalFee: wallets.USD.totalFee,
      netEarned: wallets.USD.netEarned,
      totalWithdrawn: wallets.USD.totalWithdrawn,
      withdrawals: withdrawalsWithCurrency,
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
    const currency = body?.currency === "VES" ? "VES" : "USD";
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

    const allowedMethodsByCurrency: Record<WalletCurrency, string[]> = {
      USD: ["ZELLE", "TRANSFERENCIA"],
      VES: ["PAGO_MOVIL", "TRANSFERENCIA"],
    };

    if (!allowedMethodsByCurrency[currency].includes(paymentMethod)) {
      return NextResponse.json(
        { error: `Método de pago inválido para ${currency}` },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;
    const wallets = await calculateWallets(user.id);
    const availableToWithdraw = wallets[currency].availableToWithdraw;
    const symbol = getCurrencySymbol(currency);

    if (amount > availableToWithdraw + 0.01) {
      return NextResponse.json(
        {
          error: `El monto solicitado (${symbol}${amount.toFixed(2)}) supera el balance disponible (${symbol}${availableToWithdraw.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    const withdrawal = await prismaAny.withdrawalRequest.create({
      data: {
        hostId: user.id,
        amount,
        paymentMethod,
        paymentDetails: {
          ...(paymentDetails as Record<string, unknown>),
          currency,
        },
        status: "PENDING",
      },
    });

    return NextResponse.json({ withdrawal }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}



