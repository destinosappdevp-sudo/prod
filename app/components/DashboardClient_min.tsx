"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  CalendarCheck,
  List,
  BarChart3,
  User,
  LogOut,
  Search,
  Bell,
  CalendarDays,
  Star,
  PieChart,
  DollarSign,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  role?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  country?: string;
  city?: string;
  initialTab?: string;
  stats?: any;
  reservations?: any[];
  listings?: any[];
  favorites?: any[];
  guestReservations?: any[];
}

export default function DashboardClient(props: DashboardClientProps) {
  if (props.role === "HOST") {
    // Lógica de dashboard para HOST (idéntica a HostDashboardClient)
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchTerm, setSearchTerm] = useState("");
    const [reservationFilter, setReservationFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");

    const statCards = useMemo(
      () => [
        {
          label: "Ingresos Totales",
          value: `$${props.stats?.totalRevenue?.toFixed(2)}`,
          note: "Bruto del mes",
          icon: DollarSign,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "Comisión ZERKKA",
          value: `-$${props.stats?.serviceFee?.toFixed(2)}`,
          note: "Tarifa de servicio",
          icon: PieChart,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
        {
          label: "Pendiente",
          value: `$${props.stats?.pendingAmount?.toFixed(2)}`,
          note: "Reservas futuras",
          icon: CalendarDays,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
        },
        {
          label: "Disponible",
          value: `$${props.stats?.availableAmount?.toFixed(2)}`,
          note: "Retirar fondos",
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-50",
        },
      ],
      [props.stats]
    );

    // ...existing code for smallStats, sidebar, main, tabs, etc. (idéntico a HostDashboardClient)
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {/* ...sidebar y navegación igual que HostDashboardClient... */}
        <main className="flex-1 px-8 py-8">
          <h1 className="text-2xl font-bold mb-4">Panel de Anfitrión</h1>
          {/* Aquí iría el resto de la lógica de tabs, cards, reservas, anuncios, etc. */}
          <pre className="bg-white p-4 rounded-xl text-xs text-slate-700 overflow-x-auto">
            {JSON.stringify({ stats: props.stats, reservations: props.reservations, listings: props.listings }, null, 2)}
          </pre>
        </main>
      </div>
    );
  }

  // Lógica de dashboard para GUEST
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold mb-4">Panel de Cliente</h1>
      <div className="w-full max-w-3xl space-y-8">
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Heart className="text-pink-500" size={18}/> Favoritos</h2>
          {props.favorites && props.favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {props.favorites.map((fav: any) => (
                <div key={fav.id} className="border rounded-xl p-4 flex gap-4 items-center">
                  <Image src={fav.photo || "/screenshot/no-image.png"} alt={fav.title} width={64} height={64} className="rounded-lg object-cover" />
                  <div>
                    <div className="font-semibold">{fav.title}</div>
                    <div className="text-sm text-slate-500">{fav.country} {fav.municipality}</div>
                    <div className="text-sm text-orange-600 font-bold">${fav.price}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500">No tienes favoritos guardados.</div>
          )}
        </section>
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarCheck className="text-blue-500" size={18}/> Reservas</h2>
          {props.guestReservations && props.guestReservations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {props.guestReservations.map((res: any) => (
                <div key={res.id} className="border rounded-xl p-4 flex gap-4 items-center">
                  <Image src={res.photo || "/screenshot/no-image.png"} alt={res.title} width={64} height={64} className="rounded-lg object-cover" />
                  <div>
                    <div className="font-semibold">{res.title}</div>
                    <div className="text-sm text-slate-500">{res.country} {res.municipality}</div>
                    <div className="text-sm text-orange-600 font-bold">${res.price}</div>
                    <div className="text-xs text-slate-400 mt-1">{res.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500">No tienes reservas recientes.</div>
          )}
        </section>
      </div>
    </div>
  );
}
