"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ReportsPageContent() {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [homesData, setHomesData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [reservationsData, setReservationsData] = useState<any[]>([]);
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

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground"><p className="text-lg">Cargando datos...</p></div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Crecimiento de Usuarios</h3>
        {usersData.length > 0 && <Chart options={{ chart: { id: "users" }, xaxis: { categories: usersData.map((d: any) => d.month) } } as any} series={[{ name: "Usuarios", data: usersData.map((d: any) => d.count || 0) }]} type="bar" height={200} />}
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Destinos creados</h3>
        {homesData.length > 0 && <Chart options={{ chart: { id: "homes" }, xaxis: { categories: homesData.map((d: any) => d.month) } } as any} series={[{ name: "Destinos", data: homesData.map((d: any) => d.count || 0) }]} type="bar" height={200} />}
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos</h3>
        {paymentsData.length > 0 && <Chart options={{ chart: { id: "payments" }, xaxis: { categories: paymentsData.map((d: any) => d.month) } } as any} series={[{ name: "Ingresos", data: paymentsData.map((d: any) => d.total || 0) }]} type="line" height={200} />}
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reservas</h3>
        {reservationsData.length > 0 && <Chart options={{ chart: { id: "reservations" }, xaxis: { categories: reservationsData.map((d: any) => d.month) } } as any} series={[{ name: "Reservas", data: reservationsData.map((d: any) => d.count || 0) }]} type="bar" height={200} />}
      </Card>
    </div>
  );
}
