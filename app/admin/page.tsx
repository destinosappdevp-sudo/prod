import { Card } from "@/components/ui/card";
import { unstable_noStore } from "next/cache";
import prisma from "@/app/lib/db";
import { Users, Home, AlertCircle, CalendarDays, TrendingUp, PiggyBank } from "lucide-react";
import Link from "next/link";
import { formatBcvRateDisplay } from "@/app/lib/bcv-rate-format";

async function getAdminStats() {
  unstable_noStore();

  const now = new Date();

  const prismaAny = prisma as any;
  const [totalUsers, totalProperties, pendingPayments, platformConfig, savingsAgg, savingsCount, pendingSavings] =
    await Promise.all([
      prisma.user.count(),
      prisma.destination.count(),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.platformConfig.findFirst({
        select: { bcvRate: true, bcvRateDate: true },
      }),
      prisma.saving.aggregate({
        _sum: { amountUsd: true },
      }),
      prisma.saving.count(),
      prismaAny.saving.count({ where: { status: "PENDING" } }),
    ]);

  const venezuelaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
  const serverDate = venezuelaTime.toLocaleDateString("es-VE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const serverTime = venezuelaTime.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const bcvRate = formatBcvRateDisplay(platformConfig?.bcvRate);
  const bcvDate = platformConfig?.bcvRateDate
    ? new Date(platformConfig.bcvRateDate).toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  const totalEnAlcancias = savingsAgg._sum.amountUsd ?? 0;

  return {
    totalUsers,
    totalProperties,
    pendingPayments,
    serverDate,
    serverTime,
    bcvRate,
    bcvDate,
    savingsCount,
    totalEnAlcancias,
    pendingSavings,
  };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      format: "number" as const,
    },
    {
      title: "Destinos",
      value: stats.totalProperties,
      icon: Home,
      format: "number" as const,
    },
    {
      title: "Alcancías creadas",
      value: stats.savingsCount,
      icon: PiggyBank,
      format: "number" as const,
    },
    {
      title: "Total en alcancías",
      value: stats.totalEnAlcancias,
      icon: PiggyBank,
      format: "money" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenido al panel de administración de Destinos Venezuela</p>
        </div>
        <div>
          <Link
            href="/admin/manual"
            className="text-sm font-medium text-primary hover:text-primary/80 underline"
          >
            Manual de Admin
          </Link>
        </div>
      </div>

      {stats.pendingPayments > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center min-w-0">
              <AlertCircle className="h-5 w-5 text-yellow-400 dark:text-yellow-300 flex-shrink-0" />
              <p className="ml-3 text-sm text-yellow-700 dark:text-yellow-300">
                Tienes <span className="font-bold">{stats.pendingPayments}</span> pago(s) pendiente(s)
                de confirmación.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 underline shrink-0"
            >
              Ver pagos →
            </Link>
          </div>
        </div>
      )}

      {stats.pendingSavings > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-400 dark:border-orange-500 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center min-w-0">
              <PiggyBank className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              <p className="ml-3 text-sm text-orange-800 dark:text-orange-300">
                Tienes <span className="font-bold">{stats.pendingSavings}</span> depósito(s) a alcancía esperando aprobación.
              </p>
            </div>
            <Link
              href="/admin/savings"
              className="text-sm font-medium text-orange-800 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-200 underline shrink-0"
            >
              Revisar depósitos →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Fecha y hora del servidor
              </p>
              <p className="text-lg font-bold text-foreground mt-2 capitalize">{stats.serverDate}</p>
              <p className="text-2xl font-bold text-foreground mt-1 font-mono">{stats.serverTime}</p>
              <p className="text-xs text-muted-foreground mt-2">Hora Venezuela (VET)</p>
            </div>
            <div className="p-3 rounded-lg bg-primary-soft shrink-0">
              <CalendarDays className="text-primary" size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tasa BCV</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {stats.bcvRate !== "—" ? `Bs. ${stats.bcvRate}` : "—"}
              </p>
              {stats.bcvDate && (
                <p className="text-xs text-muted-foreground mt-1">Actualizada: {stats.bcvDate}</p>
              )}
              {!stats.bcvDate && <p className="text-xs text-muted-foreground mt-1">Sin configurar</p>}
            </div>
            <div className="p-3 rounded-lg bg-primary-soft">
              <TrendingUp className="text-primary" size={22} />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const displayValue =
            stat.format === "money"
              ? `$${(stat.value as number).toFixed(2)}`
              : stat.value;

          return (
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 text-foreground">{displayValue}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary-soft">
                  <Icon className="text-primary" size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground">Configuración</h2>
        <Card className="mt-3 p-4">
          <div className="flex flex-col gap-2">
            <Link href="/admin/settings" className="text-sm text-foreground hover:underline">
              Ajustes de la plataforma
            </Link>
            <Link href="/admin/manual" className="text-sm text-primary hover:text-primary/80">
              Manual de Admin
            </Link>
          </div>
        </Card>
      </div>
      <div className="mt-10 text-center text-xs text-muted-foreground/50">
        v{Date.now().toString(36)} · deploy {new Date().toISOString().slice(0, 10)}
      </div>
    </div>
  );
}
