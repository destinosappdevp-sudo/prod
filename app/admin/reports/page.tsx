
"use client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Home } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type ReportEntry = { month: string; count?: number; total?: number };

export default function ReportsPage() {
  const [usersData, setUsersData] = useState<ReportEntry[]>([]);
  const [homesData, setHomesData] = useState<ReportEntry[]>([]);
  const [paymentsData, setPaymentsData] = useState<ReportEntry[]>([]);
  const [reservationsData, setReservationsData] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/reports/users").then(r => r.json()).catch(() => []),
      fetch("/api/admin/reports/homes").then(r => r.json()).catch(() => []),
      fetch("/api/admin/reports/payments").then(r => r.json()).catch(() => []),
      fetch("/api/admin/reports/reservations").then(r => r.json()).catch(() => []),
    ]).then(([u, h, p, r]) => {
      setUsersData(Array.isArray(u) ? u : []);
      setHomesData(Array.isArray(h) ? h : []);
      setPaymentsData(Array.isArray(p) ? p : []);
      setReservationsData(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Informes & Analytics</h1>
          <p className="text-gray-600 mt-1">Análisis de datos y reportes de rendimiento</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p className="text-lg">Cargando datos...</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Crecimiento de Usuarios</h3>
          <div className="h-64">
            {usersData.length > 0 ? (
              <Chart
                type="bar"
                options={{
                  chart: { id: "users-bar", toolbar: { show: false } },
                  xaxis: { categories: usersData.map(d => d.month) },
                  colors: ["#f97316"],
                }}
                series={[{ name: "Usuarios", data: usersData.map(d => d.count ?? 0) }]}
                height={250}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Users size={48} className="mb-2" />
                <p>Sin datos disponibles</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Publicaciones por Mes</h3>
          <div className="h-64">
            {homesData.length > 0 ? (
              <Chart
                type="bar"
                options={{
                  chart: { id: "homes-bar", toolbar: { show: false } },
                  xaxis: { categories: homesData.map(d => d.month) },
                  colors: ["#3b82f6"],
                }}
                series={[{ name: "Publicaciones", data: homesData.map(d => d.count ?? 0) }]}
                height={250}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Home size={48} className="mb-2" />
                <p>Sin datos disponibles</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ingresos Mensuales</h3>
          <div className="h-64">
            {paymentsData.length > 0 ? (
              <Chart
                type="line"
                options={{
                  chart: { id: "payments-line", toolbar: { show: false } },
                  xaxis: { categories: paymentsData.map(d => d.month) },
                  colors: ["#10b981"],
                  yaxis: { labels: { formatter: (v: number) => `$${v.toFixed(0)}` } },
                }}
                series={[{ name: "Ingresos", data: paymentsData.map(d => d.total ?? 0) }]}
                height={250}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <TrendingUp size={48} className="mb-2" />
                <p>Sin datos disponibles</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Análisis de Reservas</h3>
          <div className="h-64">
            {reservationsData.length > 0 ? (
              <Chart
                type="bar"
                options={{
                  chart: { id: "reservations-bar", toolbar: { show: false } },
                  xaxis: { categories: reservationsData.map(d => d.month) },
                  colors: ["#8b5cf6"],
                }}
                series={[{ name: "Reservas", data: reservationsData.map(d => d.count ?? 0) }]}
                height={250}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <BarChart3 size={48} className="mb-2" />
                <p>Sin datos disponibles</p>
              </div>
            )}
          </div>
        </Card>
      </div>
      )}
    </div>
  );
}



