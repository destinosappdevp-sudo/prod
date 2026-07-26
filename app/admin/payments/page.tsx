import { unstable_noStore } from "next/cache";
import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { DollarSign, CreditCard, AlertCircle, PiggyBank } from "lucide-react";
import FinanzasClient from "./FinanzasClient";
import { parsePaymentFinancials } from "@/app/lib/payment-currency";

const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;
const formatBs = (amount: number) => `Bs ${amount.toFixed(2)}`;

async function getMovementsForFinanzas() {
  unstable_noStore();

  const prismaAny = prisma as any;

  const [payments, savings] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        Reservation: {
          select: {
            id: true,
            totalAmount: true,
            User: {
              select: {
                id: true,
                firstName: true,
                email: true,
              },
            },
            Home: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }),
    prismaAny.saving.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const paymentMovements = payments.map((payment) => ({
    id: payment.id,
    type: "payment" as const,
    date: payment.confirmedAt || payment.createdAt,
    user: payment.Reservation?.User
      ? {
          id: payment.Reservation.User.id,
          firstName: payment.Reservation.User.firstName,
          email: payment.Reservation.User.email,
        }
      : null,
    homeTitle: payment.Reservation?.Home?.title || "—",
    amountUsd: payment.amount,
    amountBs: null,
    status: payment.status,
    referenceNumber: payment.referenceNumber,
    paymentMethod: payment.paymentMethod,
    paymentDetails: payment.paymentDetails,
    paymentProofUrl: payment.paymentProofUrl,
    rejectionReason: payment.rejectionReason,
    reservationId: payment.Reservation?.id ?? null,
    raw: payment,
  }));

  const savingMovements = (savings as Array<any>).map((saving) => {
    const details =
      saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? (saving.paymentDetails as Record<string, unknown>)
        : {};

    return {
      id: saving.id,
      type: "saving" as const,
      date: saving.date || saving.createdAt,
      user: saving.User
        ? {
            id: saving.User.id,
            firstName: saving.User.firstName,
            email: saving.User.email,
          }
        : null,
      homeTitle:
        typeof details.homeTitle === "string" && details.homeTitle.trim()
          ? details.homeTitle
          : typeof details.packageTitle === "string" && details.packageTitle.trim()
          ? details.packageTitle
          : "—",
      amountUsd: saving.amountUsd,
      amountBs: saving.amountBs,
      status: saving.status,
      referenceNumber: typeof details.referenceNumber === "string" ? details.referenceNumber : null,
      paymentMethod: null,
      paymentDetails: saving.paymentDetails,
      paymentProofUrl:
        typeof details.paymentProofUrl === "string" && details.paymentProofUrl.trim()
          ? details.paymentProofUrl
          : null,
      rejectionReason: saving.rejectionReason,
      reservationId: null,
      raw: saving,
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
  const prismaAny = prisma as any;
  const [
    pendingApprovalPayments,
    confirmedPayments,
    confirmedPaymentRows,
    alcanciasActivas,
    montoAlcanciasAgg,
  ] = await Promise.all([
    prismaAny.payment.count({ where: { status: "PENDING" } }),
    prismaAny.payment.count({ where: { status: "CONFIRMED" } }),
    prismaAny.payment.findMany({
      where: { status: "CONFIRMED" },
      select: {
        amount: true,
        subtotal: true,
        serviceFee: true,
        paymentMethod: true,
        paymentDetails: true,
      },
    }),
    prisma.saving.groupBy({ by: ["userId"] }).then((rows) => rows.length),
    prisma.saving.aggregate({
      _sum: { amountUsd: true, amountBs: true },
    }),
  ]);

  let totalRevenueUsd = 0;
  let totalRevenueBs = 0;

  for (const payment of confirmedPaymentRows as Array<any>) {
    const parsed = parsePaymentFinancials({
      amount: payment.amount ?? 0,
      subtotal: payment.subtotal ?? 0,
      serviceFee: payment.serviceFee ?? 0,
      paymentMethod: payment.paymentMethod,
      paymentDetails: payment.paymentDetails,
    });

    totalRevenueUsd += parsed.amountUsd;
    totalRevenueBs += parsed.amountBs;
  }

  const montoAlcanciasUsd = montoAlcanciasAgg._sum.amountUsd ?? 0;
  const montoAlcanciasBs = montoAlcanciasAgg._sum.amountBs ?? 0;

  return {
    pendingApprovalPayments,
    confirmedPayments,
    totalRevenueUsd: Number(totalRevenueUsd.toFixed(2)),
    totalRevenueBs: Number(totalRevenueBs.toFixed(2)),
    alcanciasActivas,
    montoAlcanciasUsd: Number(montoAlcanciasUsd.toFixed(2)),
    montoAlcanciasBs: Number(montoAlcanciasBs.toFixed(2)),
  };
}

export default async function FinanzasPage() {
  const movements = await getMovementsForFinanzas();
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finanzas</h1>
          <p className="text-muted-foreground mt-1">Ingresos, pagos y alcancías</p>
        </div>
      </div>

      {stats.pendingApprovalPayments > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes <span className="font-bold">{stats.pendingApprovalPayments}</span> pago(s)
                pendiente(s) de confirmación.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-soft rounded-lg">
              <DollarSign className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos confirmados</p>
              <div className="mt-1">
                <p className="text-2xl font-bold leading-tight text-foreground">{formatUsd(stats.totalRevenueUsd)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBs(stats.totalRevenueBs)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-soft rounded-lg">
              <PiggyBank className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alcancías activas</p>
              <p className="text-xs text-muted-foreground">Usuarios con depósitos en alcancía</p>
              <p className="text-2xl font-bold text-foreground">{stats.alcanciasActivas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-soft rounded-lg">
              <DollarSign className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto en alcancías</p>
              <div className="mt-1">
                <p className="text-2xl font-bold leading-tight text-foreground">{formatUsd(stats.montoAlcanciasUsd)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBs(stats.montoAlcanciasBs)}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-soft rounded-lg">
              <CreditCard className="text-primary" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagos confirmados</p>
              <p className="text-2xl font-bold text-foreground">{stats.confirmedPayments}</p>
            </div>
          </div>
        </Card>
      </div>

      <FinanzasClient movements={movements} />
    </div>
  );
}



