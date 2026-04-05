import { Card } from "@/components/ui/card";
import { unstable_noStore } from 'next/cache';
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { 
  Users, 
  Home, 
  DollarSign, 
  Wallet,
  Calendar,
  TrendingDown,
  AlertCircle,
  CalendarDays,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatBcvRateDisplay } from "@/app/lib/bcv-rate-format";

async function getAdminStats() {
  unstable_noStore();
  const prismaAny = prisma as any;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalProperties,
    reservationsThisMonth,
    pendingPayments,
    confirmedRevenueThisMonth,
    pendingPayoutTotals,
    zerkkaRevenueThisMonth,
    platformConfig,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.home.count(),
    prismaAny.reservation.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prismaAny.payment.count({ where: { status: "PENDING" } }),
    prismaAny.payment.aggregate({
      where: { status: "CONFIRMED", confirmedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prismaAny.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true, serviceFee: true },
    }),
    prismaAny.payment.aggregate({
      where: { status: "CONFIRMED", confirmedAt: { gte: startOfMonth } },
      _sum: { serviceFee: true },
    }),
    prismaAny.platformConfig.findFirst({
      select: { bcvRate: true, bcvRateDate: true },
    }),
  ]);

  // Server time in Venezuela timezone
  const venezuelaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
  const serverDate = venezuelaTime.toLocaleDateString("es-VE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const serverTime = venezuelaTime.toLocaleTimeString("es-VE", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  const bcvRate = formatBcvRateDisplay(platformConfig?.bcvRate);
  const bcvDate = platformConfig?.bcvRateDate
    ? new Date(platformConfig.bcvRateDate).toLocaleDateString("es-VE", {
        day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
      })
    : null;

  return {
    totalUsers,
    totalProperties,
    reservationsThisMonth,
    pendingPayments,
    confirmedRevenueThisMonth: confirmedRevenueThisMonth._sum.amount || 0,
    pendingPayoutAmount: Math.max(
      0,
      (pendingPayoutTotals._sum.amount || 0) -
        (pendingPayoutTotals._sum.serviceFee || 0)
    ),
    zerkkaRevenueThisMonth: zerkkaRevenueThisMonth._sum.serviceFee || 0,
    serverDate,
    serverTime,
    bcvRate,
    bcvDate,
  };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    if (userRecord?.role === "BANER") {
      redirect("/admin/banners");
    }
  }

  const stats = await getAdminStats();

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      color: "blue",
      format: "number",
    },
    {
      title: "Paquetes",
      value: stats.totalProperties,
      icon: Home,
      color: "green",
      format: "number",
    },
    {
      title: "Reservas este mes",
      value: stats.reservationsThisMonth,
      icon: Calendar,
      color: "purple",
      format: "number",
    },
    {
      title: "Ingresos Confirmados",
      value: stats.confirmedRevenueThisMonth,
      icon: DollarSign,
      color: "yellow",
      format: "money",
    },
    {
      title: "Ingresos por retirar",
      value: stats.pendingPayoutAmount,
      icon: Wallet,
      color: "indigo",
      format: "money",
    },
    {
      title: "Ingresos Destinos Venezuela",
      value: stats.zerkkaRevenueThisMonth,
      icon: TrendingDown,
      color: "pink",
      format: "money",
    },
  ];

  const bgColors: Record<string, string> = {
    blue: "bg-blue-100", green: "bg-green-100", purple: "bg-purple-100",
    yellow: "bg-yellow-100", indigo: "bg-indigo-100", pink: "bg-pink-100",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600", green: "text-green-600", purple: "text-purple-600",
    yellow: "text-yellow-600", indigo: "text-indigo-600", pink: "text-pink-600",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración de Destinos Venezuela</p>
      </div>

      {/* Alert for pending payments */}
      {stats.pendingPayments > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <p className="ml-3 text-sm text-yellow-700">
                Tienes <span className="font-bold">{stats.pendingPayments}</span> pago(s) pendiente(s) de confirmación.
              </p>
            </div>
            <Link href="/admin/payments" className="text-sm font-medium text-yellow-700 hover:text-yellow-800 underline">
              Ver pagos →
            </Link>
          </div>
        </div>
      )}

      {/* Info Cards: Fecha, Hora, Tasa BCV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fecha */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Fecha del Servidor</p>
              <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{stats.serverDate}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDays className="text-blue-600" size={22} />
            </div>
          </div>
        </Card>

        {/* Hora */}
        <Card className="p-6 border-l-4 border-l-violet-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Hora del Servidor</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 font-mono">{stats.serverTime}</p>
              <p className="text-xs text-gray-400 mt-1">Hora Venezuela (VET)</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-lg">
              <Clock className="text-violet-600" size={22} />
            </div>
          </div>
        </Card>

        {/* Tasa BCV */}
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
              {!stats.bcvDate && (
                <p className="text-xs text-gray-400 mt-1">Sin configurar</p>
              )}
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={22} />
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const displayValue = stat.format === "money"
            ? `$${(stat.value as number).toFixed(2)}`
            : stat.value;

          return (
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{displayValue}</p>
                  {stat.format === "money" && (
                    <p className="text-xs text-gray-400 mt-1">Mes actual</p>
                  )}
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
