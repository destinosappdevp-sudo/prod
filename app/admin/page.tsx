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
      prisma.home.count(),
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
      color: "blue",
      format: "number" as const,
    },
    {
      title: "Paquetes",
      value: stats.totalProperties,
      icon: Home,
      color: "green",
      format: "number" as const,
    },
    {
      title: "Alcancías creadas",
      value: stats.savingsCount,
      icon: PiggyBank,
      color: "purple",
      format: "number" as const,
    },
    {
      title: "Total en alcancías",
      value: stats.totalEnAlcancias,
      icon: PiggyBank,
      color: "amber",
      format: "money" as const,
    },
  ];

  const bgColors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/50",
    green: "bg-green-100 dark:bg-green-900/50",
    purple: "bg-purple-100 dark:bg-purple-900/50",
    amber: "bg-amber-100 dark:bg-amber-900/50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Bienvenido al panel de administración de Destinos Venezuela</p>
        </div>
        <div>
          <Link
            href="/admin/manual"
            className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline"
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
        <Card className="p-6 border-l-4 border-l-blue-500 dark:bg-slate-800 dark:border-l-blue-400">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fecha y hora del servidor
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-2 capitalize">{stats.serverDate}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 font-mono">{stats.serverTime}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Hora Venezuela (VET)</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
              <CalendarDays className="text-blue-600 dark:text-blue-400" size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500 dark:bg-slate-800 dark:border-l-emerald-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tasa BCV</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.bcvRate !== "—" ? `Bs. ${stats.bcvRate}` : "—"}
              </p>
              {stats.bcvDate && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Actualizada: {stats.bcvDate}</p>
              )}
              {!stats.bcvDate && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sin configurar</p>}
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={22} />
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
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow dark:bg-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2 dark:text-white">{displayValue}</p>
                </div>
                <div className={`p-3 rounded-lg ${bgColors[stat.color]}`}>
                  <Icon className={iconColors[stat.color]} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configuración</h2>
        <Card className="mt-3 p-4 dark:bg-slate-800">
          <div className="flex flex-col gap-2">
            <Link href="/admin/settings" className="text-sm text-gray-700 dark:text-gray-300 hover:underline">
              Ajustes de la plataforma
            </Link>
            <Link href="/admin/manual" className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300">
              Manual de Admin
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
