
"use client";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Home } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReportsPage() {
  const [usersData, setUsersData] = useState([]);
  const [homesData, setHomesData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [reservationsData, setReservationsData] = useState([]);

  useEffect(() => {
    fetch("/api/admin/reports/users").then(r => r.json()).then(setUsersData);
    fetch("/api/admin/reports/homes").then(r => r.json()).then(setHomesData);
    fetch("/api/admin/reports/payments").then(r => r.json()).then(setPaymentsData);
    fetch("/api/admin/reports/reservations").then(r => r.json()).then(setReservationsData);
  }, []);

  const months = usersData.map((d: any) => d.month);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Informes & Analytics</h1>
          <p className="text-gray-600 mt-1">Análisis de datos y reportes de rendimiento</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
          Generar Reporte
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Crecimiento de Usuarios</h3>
          <div className="h-64">
            {usersData.length > 0 ? (
              <Chart
                type="bar"
                options={{
                  chart: { id: "users-bar" },
                  xaxis: { categories: months },
                  title: { text: "Usuarios por mes" },
                }}
                series={[{ name: "Usuarios", data: usersData.map((d: any) => d.count) }]}
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Users size={48} className="mx-auto mb-2" />
                <p>Sin datos</p>
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
                  chart: { id: "homes-bar" },
                  xaxis: { categories: months },
                  title: { text: "Publicaciones por mes" },
                }}
                series={[{ name: "Publicaciones", data: homesData.map((d: any) => d.count) }]}
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Home size={48} className="mx-auto mb-2" />
                <p>Sin datos</p>
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
                  chart: { id: "payments-line" },
                  xaxis: { categories: months },
                  title: { text: "Ingresos mensuales" },
                }}
                series={[{ name: "Ingresos", data: paymentsData.map((d: any) => d.total) }]}
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <TrendingUp size={48} className="mx-auto mb-2" />
                <p>Sin datos</p>
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
                  chart: { id: "reservations-bar" },
                  xaxis: { categories: months },
                  title: { text: "Reservas por mes" },
                }}
                series={[{ name: "Reservas", data: reservationsData.map((d: any) => d.count) }]}
                height={250}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-2" />
                <p>Sin datos</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reportes Disponibles (Próximamente)</h3>
        <div className="grid grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left" disabled>
            <p className="font-medium text-gray-700">Reporte Mensual</p>
            <p className="text-sm text-gray-500 mt-1">Análisis completo del mes</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left" disabled>
            <p className="font-medium text-gray-700">Reporte de Usuarios</p>
            <p className="text-sm text-gray-500 mt-1">Estadísticas de usuarios</p>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-left" disabled>
            <p className="font-medium text-gray-700">Reporte Financiero</p>
            <p className="text-sm text-gray-500 mt-1">Análisis de ingresos</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
