import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Verify user is HOST
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (userRecord?.role !== "HOST") {
      redirect("/my-dashboard");
    }

    // TODO: Fetch analytics data for HOST properties

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

          {/* TODO: Agregar gráficos y datos de analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Ingresos</h2>
              <div className="flex items-center justify-center h-64">
                <BarChart3 className="text-slate-300" size={48} />
              </div>
            </div>

            {/* Occupancy Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Ocupación</h2>
              <div className="flex items-center justify-center h-64">
                <BarChart3 className="text-slate-300" size={48} />
              </div>
            </div>

            {/* Bookings Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Reservas por Mes</h2>
              <div className="flex items-center justify-center h-64">
                <BarChart3 className="text-slate-300" size={48} />
              </div>
            </div>

            {/* Guest Reviews */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Calificaciones</h2>
              <div className="flex items-center justify-center h-64">
                <BarChart3 className="text-slate-300" size={48} />
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
