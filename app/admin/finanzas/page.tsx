import { unstable_noStore } from "next/cache";
import prisma from "@/app/lib/db";
import FinanzasGroupClient from "../components/FinanzasGroupClient";
import { parsePaymentFinancials } from "@/app/lib/payment-currency";

const prismaAny = prisma as any;

async function getMovements() {
  unstable_noStore();
  const [payments, savings] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Reservation: {
          select: {
            id: true, totalAmount: true,
            User: { select: { id: true, firstName: true, email: true } },
            Home: { select: { title: true } },
          },
        },
      },
    }),
    prismaAny.saving.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: { User: { select: { id: true, firstName: true, email: true } } },
    }),
  ]);

  const paymentMovements = payments.map((p: any) => ({
    id: p.id, type: "payment" as const, date: p.confirmedAt || p.createdAt,
    user: p.Reservation?.User ? { id: p.Reservation.User.id, firstName: p.Reservation.User.firstName, email: p.Reservation.User.email } : null,
    homeTitle: p.Reservation?.Home?.title || "—",
    amountUsd: p.amount, amountBs: null, status: p.status,
    referenceNumber: p.referenceNumber, paymentMethod: p.paymentMethod,
    paymentDetails: p.paymentDetails, paymentProofUrl: p.paymentProofUrl,
    rejectionReason: p.rejectionReason, reservationId: p.Reservation?.id ?? null, raw: p,
  }));

  const savingMovements = (savings as Array<any>).map((saving) => {
    const details = saving.paymentDetails && typeof saving.paymentDetails === "object" ? saving.paymentDetails as Record<string, unknown> : {};
    return {
      id: saving.id, type: "saving" as const, date: saving.date || saving.createdAt,
      user: saving.User ? { id: saving.User.id, firstName: saving.User.firstName, email: saving.User.email } : null,
      homeTitle: typeof details.homeTitle === "string" && details.homeTitle.trim() ? details.homeTitle : "—",
      amountUsd: saving.amountUsd, amountBs: saving.amountBs, status: saving.status,
      referenceNumber: typeof details.referenceNumber === "string" ? details.referenceNumber : null,
      paymentMethod: null, paymentDetails: saving.paymentDetails,
      paymentProofUrl: typeof details.paymentProofUrl === "string" && details.paymentProofUrl.trim() ? details.paymentProofUrl : null,
      rejectionReason: saving.rejectionReason, reservationId: null, raw: saving,
    };
  });

  return [...paymentMovements, ...savingMovements].sort((a, b) => {
    const timeA = new Date(a.date ?? 0).getTime();
    const timeB = new Date(b.date ?? 0).getTime();
    return timeB - timeA;
  });
}

async function getStats() {
  unstable_noStore();
  const [pendingApprovalPayments, confirmedPayments, confirmedPaymentRows, alcanciasActivas, montoAlcanciasAgg] = await Promise.all([
    prismaAny.payment.count({ where: { status: "PENDING" } }),
    prismaAny.payment.count({ where: { status: "CONFIRMED" } }),
    prismaAny.payment.findMany({
      where: { status: "CONFIRMED" },
      select: { amount: true, subtotal: true, serviceFee: true, paymentMethod: true, paymentDetails: true },
    }),
    prisma.saving.groupBy({ by: ["userId"] }).then((rows) => rows.length),
    prisma.saving.aggregate({ _sum: { amountUsd: true, amountBs: true } }),
  ]);

  let totalRevenueUsd = 0;
  let totalRevenueBs = 0;
  for (const payment of confirmedPaymentRows as Array<any>) {
    const parsed = parsePaymentFinancials(payment);
    totalRevenueUsd += parsed.amountUsd;
    totalRevenueBs += parsed.amountBs;
  }

  return {
    pendingApprovalPayments, confirmedPayments,
    totalRevenueUsd: Number(totalRevenueUsd.toFixed(2)),
    totalRevenueBs: Number(totalRevenueBs.toFixed(2)),
    alcanciasActivas,
    montoAlcanciasUsd: Number((montoAlcanciasAgg._sum.amountUsd ?? 0).toFixed(2)),
    montoAlcanciasBs: Number((montoAlcanciasAgg._sum.amountBs ?? 0).toFixed(2)),
  };
}

function roundMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

async function getSavingsData() {
  unstable_noStore();
  const [savings, users, homes] = await Promise.all([
    prismaAny.saving.findMany({
      orderBy: [{ status: "asc" }, { date: "desc" }],
      include: { User: { select: { id: true, firstName: true, email: true } } },
    }),
    prisma.user.findMany({
      select: { id: true, firstName: true, email: true, cedula: true },
      orderBy: [{ cedula: "asc" }, { firstName: "asc" }],
    }),
    prisma.home.findMany({
      select: { id: true, title: true, price: true, priceVip: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const pendingUsd = (savings as any[])
    .filter((s: any) => s.status === "PENDING" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);
  const approvedUsd = (savings as any[])
    .filter((s: any) => s.status === "APPROVED" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);
  const homeTitleById = new Map<string, string>();
  const homePricingById = new Map<string, { price: number; priceVip: number }>();
  (homes as any[]).forEach((home: any) => {
    homeTitleById.set(home.id, home.title || "Paquete sin título");
    homePricingById.set(home.id, { price: Number(home.price ?? 0), priceVip: Number(home.priceVip ?? 0) });
  });

  const packageMetaMap = new Map<string, { plan: "vip" | "estandar"; guests: number; ts: number }>();
  const packageApprovedPositiveMap = new Map<string, number>();
  const packageHasDebitMap = new Map<string, boolean>();

  for (const s of savings as any[]) {
    const details = s.paymentDetails && typeof s.paymentDetails === "object"
      ? (s.paymentDetails as Record<string, any>)
      : {};
    const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;
    if (!targetHomeId) continue;

    const key = `${s.userId}:${targetHomeId}`;
    const amountUsd = Number(s.amountUsd ?? 0);

    if (s.status === "APPROVED" && amountUsd > 0) {
      const prev = Number(packageApprovedPositiveMap.get(key) ?? 0);
      packageApprovedPositiveMap.set(key, roundMoney(prev + amountUsd));
    }

    const kind = typeof details.kind === "string" ? details.kind : null;
    if (amountUsd < 0 || kind === "CHECKOUT_DEBIT") {
      packageHasDebitMap.set(key, true);
    }

    const rawPlan = typeof details.plan === "string" ? details.plan.toLowerCase() : "";
    const plan: "vip" | "estandar" | null = rawPlan === "vip" || rawPlan === "estandar" ? rawPlan : null;
    const seatIdsInput = Array.isArray(details.seatIds)
      ? details.seatIds
      : typeof details.seatIds === "string"
      ? details.seatIds.split(",")
      : [];
    const seatIds = seatIdsInput
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    const guestsFromPayload = typeof details.guests === "number" && details.guests > 0 ? details.guests : 0;
    const guestsCount = seatIds.length > 0 ? seatIds.length : guestsFromPayload > 0 ? guestsFromPayload : 0;

    if (!plan || guestsCount <= 0) continue;

    const ts = new Date(s.createdAt ?? s.date ?? 0).getTime();
    const prevMeta = packageMetaMap.get(key);
    if (!prevMeta || ts >= prevMeta.ts) {
      packageMetaMap.set(key, { plan, guests: guestsCount, ts });
    }
  }

  const walletMap = new Map<string, { userId: string; type: "general" | "package"; homeId: string | null; homeTitle: string | null; amountBs: number; amountUsd: number; goalUsd: number | null; remainingUsd: number | null; }>();

  for (const s of savings as any[]) {
    const details = s.paymentDetails && typeof s.paymentDetails === "object"
      ? (s.paymentDetails as Record<string, any>)
      : {};
    const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;
    const walletType: "general" | "package" = targetHomeId ? "package" : "general";
    const key = `${s.userId}:${targetHomeId ?? "general"}`;
    const shouldCountForBalance = s.status === "APPROVED" || Number(s.amountUsd) < 0 || Number(s.amountBs) < 0;
    if (!shouldCountForBalance) continue;
    if (!walletMap.has(key)) {
      walletMap.set(key, {
        userId: s.userId, type: walletType, homeId: targetHomeId,
        homeTitle: (typeof details.homeTitle === "string" ? details.homeTitle : null) || (targetHomeId ? homeTitleById.get(targetHomeId) || "Paquete sin título" : null),
        amountBs: 0, amountUsd: 0, goalUsd: null, remainingUsd: null,
      });
    }
    const wallet = walletMap.get(key)!;
    wallet.amountBs += Number(s.amountBs ?? 0);
    wallet.amountUsd += Number(s.amountUsd ?? 0);
  }

  const walletBalances = Array.from(walletMap.values()).map((wallet) => {
    if (wallet.type !== "package" || !wallet.homeId) return wallet;
    const key = `${wallet.userId}:${wallet.homeId}`;
    const meta = packageMetaMap.get(key);
    const pricing = homePricingById.get(wallet.homeId);
    if (!meta || !pricing) return wallet;
    const unitPrice = meta.plan === "vip" && pricing.priceVip > 0 ? pricing.priceVip : pricing.price;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return wallet;
    const goalUsd = roundMoney(unitPrice * meta.guests);
    const approvedPositiveUsd = roundMoney(Number(packageApprovedPositiveMap.get(key) ?? 0));
    const hasCheckoutDebit = packageHasDebitMap.get(key) === true;
    const remainingUsd = hasCheckoutDebit ? 0 : roundMoney(Math.max(0, goalUsd - approvedPositiveUsd));
    return { ...wallet, goalUsd, remainingUsd };
  });

  const savingsWithTarget = (savings as any[]).map((s: any) => {
    const details = s.paymentDetails && typeof s.paymentDetails === "object" ? s.paymentDetails as Record<string, any> : {};
    return { ...s, targetId: details.homeId || null };
  });

  return {
    savings: savingsWithTarget, users, homes,
    pendingUsd: Number(pendingUsd.toFixed(2)),
    approvedUsd: Number(approvedUsd.toFixed(2)),
    totalCount: savings.length,
    homeTitleById: Object.fromEntries(homeTitleById),
    homePricingById: Object.fromEntries(homePricingById),
    walletBalances,
  };
}

async function getPagomovil() {
  unstable_noStore();
  return prismaAny.pagoMovilNotificacion.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}

async function getWithdrawals() {
  unstable_noStore();
  return prismaAny.withdrawalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { User: { select: { id: true, firstName: true, email: true } } },
  });
}

export default async function FinanzasPage() {
  const [movements, stats, savingsData, notificaciones, withdrawals] = await Promise.all([
    getMovements(), getStats(), getSavingsData(), getPagomovil(), getWithdrawals(),
  ]);

  return (
    <FinanzasGroupClient
      movements={movements}
      stats={stats}
      savingsData={savingsData}
      notificaciones={notificaciones}
      withdrawals={withdrawals}
    />
  );
}
