import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { 
  Users, 
  Home, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Star,
  BarChart3
} from "lucide-react";

async function getAdminStats() {
  const [
    totalUsers,
    totalProperties,
    totalReservations,
    totalFavorites,
    activeHosts,
    pendingReservations
  ] = await Promise.all([
    prisma.user.count(),
    prisma.home.count(),
    prisma.reservation.count(),
    prisma.favorite.count(),
    prisma.user.count({ where: { role: "HOST" } }),
    prisma.reservation.count({
      where: {
        startDate: {
          gte: new Date()
        }
      }
    })
  ]);

  return {
    totalUsers,
    totalProperties,
    totalReservations,
    totalFavorites,
    activeHosts,
    pendingReservations
  };
}

export default async function AdminDashboard() {
  const stats = await getAdminStats();

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.totalUsers,
      icon: Users,
      change: "+12%",
      changeType: "positive" as const,
      color: "blue"
    },
    {
      title: "Propiedades",
      value: stats.totalProperties,
      icon: Home,
      change: "+8%",
      changeType: "positive" as const,
      color: "green"
    },
    {
      title: "Reservas Totales",
      value: stats.totalReservations,
      icon: Calendar,
      change: "+23%",
      changeType: "positive" as const,
      color: "purple"
    },
    {
      title: "Ingresos Totales",
      value: "$0",
      icon: DollarSign,
      change: "Próximamente",
      changeType: "neutral" as const,
      color: "yellow"
    },
    {
      title: "Anfitriones Activos",
      value: stats.activeHosts,
      icon: TrendingUp,
      change: "+5%",
      changeType: "positive" as const,
      color: "indigo"
    },
    {
      title: "Favoritos",
      value: stats.totalFavorites,
      icon: Star,
      change: "+18%",
      changeType: "positive" as const,
      color: "pink"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración de Zerkka</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const bgColor = {
            blue: "bg-blue-100",
            green: "bg-green-100",
            purple: "bg-purple-100",
            yellow: "bg-yellow-100",
            indigo: "bg-indigo-100",
            pink: "bg-pink-100"
          }[stat.color];

          const iconColor = {
            blue: "text-blue-600",
            green: "text-green-600",
            purple: "text-purple-600",
            yellow: "text-yellow-600",
            indigo: "text-indigo-600",
            pink: "text-pink-600"
          }[stat.color];

          return (
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className={`text-sm mt-2 ${
                    stat.changeType === "positive" ? "text-green-600" : "text-gray-500"
                  }`}>
                    {stat.change} desde el mes anterior
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${bgColor}`}>
                  <Icon className={iconColor} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left">
              ✉️ Enviar notificación a todos los usuarios
            </button>
            <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left" disabled>
              📊 Generar reporte mensual (Próximamente)
            </button>
            <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-left" disabled>
              🔧 Modo mantenimiento (Próximamente)
            </button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-700">Nuevo usuario registrado</p>
              <span className="ml-auto text-xs text-gray-500">Hace 2h</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-700">Propiedad publicada</p>
              <span className="ml-auto text-xs text-gray-500">Hace 3h</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-gray-700">Nueva reserva confirmada</p>
              <span className="ml-auto text-xs text-gray-500">Hace 5h</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Estadísticas de Crecimiento</h3>
        <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-2" />
            <p>Gráficos de analytics próximamente</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
