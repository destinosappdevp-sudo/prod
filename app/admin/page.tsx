import { Card } from "@/components/ui/card";
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
  AlertCircle
} from "lucide-react";
import Link from "next/link";

async function getAdminStats() {
  const prismaAny = prisma as any;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalProperties,
    reservationsThisMonth,
    pendingPayments,
    confirmedRevenueThisMonth,
    pendingPayoutAmount,
    zerkkaRevenueThisMonth,
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
      _sum: { subtotal: true },
    }),
    prismaAny.payment.aggregate({
      where: { status: "CONFIRMED", confirmedAt: { gte: startOfMonth } },
      _sum: { serviceFee: true },
    }),
  ]);

  return {
    totalUsers,
    totalProperties,
    reservationsThisMonth,
    pendingPayments,
    confirmedRevenueThisMonth: confirmedRevenueThisMonth._sum.amount || 0,
    pendingPayoutAmount: pendingPayoutAmount._sum.subtotal || 0,
    zerkkaRevenueThisMonth: zerkkaRevenueThisMonth._sum.serviceFee || 0,
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
      title: "Propiedades",
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
      title: "Ingresos ZerKKa",
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
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración de ZerKKa</p>
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
