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
    blue: "bg-blue-100",
    green: "bg-green-100",
    purple: "bg-purple-100",
    amber: "bg-amber-100",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Bienvenido al panel de administración de Destinos Venezuela</p>
        </div>
        <div>
          <Link
            href="/admin/manual"
            className="text-sm font-medium text-sky-600 hover:text-sky-700 underline"
          >
            Manual de Admin
          </Link>
        </div>
      </div>

      {stats.pendingPayments > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center min-w-0">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <p className="ml-3 text-sm text-yellow-700">
                Tienes <span className="font-bold">{stats.pendingPayments}</span> pago(s) pendiente(s)
                de confirmación.
              </p>
            </div>
            <Link
              href="/admin/payments"
              className="text-sm font-medium text-yellow-700 hover:text-yellow-800 underline shrink-0"
            >
              Ver pagos →
            </Link>
          </div>
        </div>
      )}

      {stats.pendingSavings > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center min-w-0">
              <PiggyBank className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <p className="ml-3 text-sm text-orange-800">
                Tienes <span className="font-bold">{stats.pendingSavings}</span> depósito(s) a alcancía esperando aprobación.
              </p>
            </div>
            <Link
              href="/admin/savings"
              className="text-sm font-medium text-orange-800 hover:text-orange-900 underline shrink-0"
            >
              Revisar depósitos →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Fecha y hora del servidor
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2 capitalize">{stats.serverDate}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{stats.serverTime}</p>
              <p className="text-xs text-gray-400 mt-2">Hora Venezuela (VET)</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg shrink-0">
              <CalendarDays className="text-blue-600" size={22} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tasa BCV</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.bcvRate !== "—" ? `Bs. ${stats.bcvRate}` : "—"}
              </p>
              {stats.bcvDate && (
                <p className="text-xs text-gray-400 mt-1">Actualizada: {stats.bcvDate}</p>
              )}
              {!stats.bcvDate && <p className="text-xs text-gray-400 mt-1">Sin configurar</p>}
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={22} />
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
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{displayValue}</p>
                </div>
                <div className={`p-3 rounded-lg ${bgColors[stat.color]}`}>
                  <Icon className={iconColors[stat.color]} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
