import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Users, Home, Star } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Verify user is HOST
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        role: true,
      },
    });

    if (userRecord?.role !== "SUPERADMIN" && userRecord?.role !== "ADMIN") {
      redirect("/my-dashboard");
    }

    // Fetch analytics data
    const homes = await (prisma as any).home.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const homeIds = homes.map((h: { id: string }) => h.id);

    // Total reservations
    const totalReservations = await (prisma as any).reservation.count({
      where: { homeId: { in: homeIds } },
    });

    // Total revenue
    const payments = await (prisma as any).payment.findMany({
      where: {
        Reservation: {
          homeId: { in: homeIds },
        },
        status: "CONFIRMED",
      },
      select: { amount: true },
    });

    const totalRevenue = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Average rating
    const reviews = await (prisma as any).review.findMany({
      where: {
        homeId: { in: homeIds },
      },
      select: { rating: true },
    });

    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    // Occupancy rate
    const completedReservations = await (prisma as any).reservation.count({
      where: {
        homeId: { in: homeIds },
        status: "COMPLETED",
      },
    });

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/my-dashboard"
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Analíticas</h1>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-semibold text-sm">
                  Ingresos Totales
                </h3>
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">
                De {payments.length} pagos confirmados
              </p>
            </div>

            {/* Reservations */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-semibold text-sm">
                  Reservaciones
                </h3>
                <Users className="text-blue-600" size={20} />
              </div>
              <p className="text-2xl font-bold">{totalReservations}</p>
              <p className="text-xs text-slate-500 mt-2">
                {completedReservations} completadas
              </p>
            </div>

            {/* Properties */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-semibold text-sm">
                  Propiedades
                </h3>
                <Home className="text-orange-600" size={20} />
              </div>
              <p className="text-2xl font-bold">{homes.length}</p>
              <p className="text-xs text-slate-500 mt-2">Activas en plataforma</p>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 font-semibold text-sm">
                  Calificación
                </h3>
                <Star className="text-yellow-500" size={20} />
              </div>
              <p className="text-2xl font-bold">{avgRating}</p>
              <p className="text-xs text-slate-500 mt-2">
                De {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Ingresos por Mes</h2>
              <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
                <p className="text-slate-400">Gráfico: Tendencia de ingresos</p>
              </div>
            </div>

            {/* Occupancy Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Tasa de Ocupación</h2>
              <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
                <p className="text-slate-400">Gráfico: Ocupación por propiedad</p>
              </div>
            </div>

            {/* Bookings Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Reservas por Mes</h2>
              <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
                <p className="text-slate-400">Gráfico: Volumen de reservaciones</p>
              </div>
            </div>

            {/* Reviews Distribution */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-6">Distribución de Calificaciones</h2>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter(
                    (r: any) => r.rating === stars
                  ).length;
                  const percentage =
                    reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">{stars}★</span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-8">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading analytics:", error);
    redirect("/my-dashboard");
  }
}
