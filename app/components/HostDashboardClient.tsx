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
} from "lucide-react";
import { signOut } from "@/app/action";
import HostListingCard from "@/app/components/HostListingCard";
import { Button } from "@/components/ui/button";

interface HostStats {
  totalRevenue: number;
  serviceFee: number;
  pendingAmount: number;
  availableAmount: number;
  activeReservations: number;
  occupancy: number;
  rating: number | null;
  ratingCount: number;
  requests: number;
}

interface HostReservationItem {
  id: string;
  reservationId: string;
  guestName: string;
  guestPhone?: string;
  dates: string;
  pax: string;
  amount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  propertyName?: string;
}

interface HostListingItem {
  id: string;
  imagePath: string;
  description: string;
  stateValue: string;
  municipalityValue?: string | null;
  price: number;
  title: string;
}

interface HostDashboardClientProps {
  userName?: string;
  userEmail?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  city?: string | null;
  profileImage?: string | null;
  stats: HostStats;
  reservations: HostReservationItem[];
  listings: HostListingItem[];
}

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reservations", label: "Reservaciones", icon: CalendarCheck },
  { key: "listings", label: "Mis anuncios", icon: List },
  { key: "analytics", label: "Analiticas", icon: BarChart3 },
  { key: "profile", label: "Editar Perfil", icon: User },
];

function statusLabel(status: HostReservationItem["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmada";
    case "PENDING":
      return "Pendiente";
    case "CANCELLED":
      return "Cancelada";
    case "COMPLETED":
      return "Completada";
    default:
      return status;
  }
}

function statusStyle(status: HostReservationItem["status"]) {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "COMPLETED":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function HostDashboardClient({
  userName,
  userEmail,
  firstName,
  lastName,
  country,
  city,
  profileImage,
  stats,
  reservations,
  listings,
}: HostDashboardClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservationFilter, setReservationFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");

  const statCards = useMemo(
    () => [
      {
        label: "Ingresos Totales",
        value: `$${stats.totalRevenue.toFixed(2)}`,
        note: "Bruto del mes",
        icon: DollarSign,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Comision ZERKKA",
        value: `-$${stats.serviceFee.toFixed(2)}`,
        note: "Tarifa de servicio",
        icon: PieChart,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "Pendiente",
        value: `$${stats.pendingAmount.toFixed(2)}`,
        note: "Reservas futuras",
        icon: CalendarDays,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      },
      {
        label: "Disponible",
        value: `$${stats.availableAmount.toFixed(2)}`,
        note: "Retirar fondos",
        icon: DollarSign,
        color: "text-green-600",
        bg: "bg-green-50",
      },
    ],
    [stats]
  );

  const smallStats = [
    {
      label: "Reservas Activas",
      value: stats.activeReservations,
      note: "+2 vs mes anterior",
      icon: CalendarCheck,
      color: "text-blue-600",
    },
    {
      label: "Ocupacion Mes",
      value: `${stats.occupancy}%`,
      note: "+5% vs mes anterior",
      icon: PieChart,
      color: "text-green-600",
    },
    {
      label: "Calificacion",
      value: stats.rating ? stats.rating.toFixed(1) : "-",
      note: stats.ratingCount ? `+${stats.ratingCount} reseñas` : "Sin reseñas",
      icon: Star,
      color: "text-orange-600",
    },
    {
      label: "Solicitudes",
      value: stats.requests,
      note: "-1 vs mes anterior",
      icon: CalendarDays,
      color: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">
              Z
            </div>
            <div>
              <p className="text-sm font-semibold">ZERKKA</p>
              <p className="text-xs text-white/60">Host Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-5 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-sm">
              {userName?.[0]?.toUpperCase() || "H"}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName || "Anfitrion"}</p>
              <p className="text-xs text-white/60">{userEmail || ""}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Cerrar sesion</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Gestiona tus propiedades y reservas</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-56 rounded-full border border-slate-200 bg-white px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <button
              type="button"
              className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500"
            >
              <Bell size={18} />
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                        <p className="text-xs text-slate-400 mt-2">{card.note}</p>
                      </div>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                        <Icon className={card.color} size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {smallStats.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-slate-500">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{card.value}</p>
                        <p className="text-xs text-green-600 mt-2">{card.note}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Icon className={card.color} size={18} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Reservas Recientes</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("reservations")}
                  className="text-sm text-orange-600 hover:underline"
                >
                  Ver todas
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-2">Huesped</th>
                      <th className="py-2">Fechas</th>
                      <th className="py-2">PAX</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation) => (
                      <tr key={reservation.id} className="border-t border-slate-100">
                        <td className="py-3 text-slate-700 font-medium">
                          {reservation.guestName}
                        </td>
                        <td className="py-3 text-slate-500">{reservation.dates}</td>
                        <td className="py-3 text-slate-500">{reservation.pax}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                              reservation.status
                            )}`}
                          >
                            {statusLabel(reservation.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
              <h3 className="text-lg font-semibold">Acciones de Anfitrion</h3>
              <p className="text-sm text-white/70 mt-1">Gestiona tus propiedades</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button className="bg-white/10 hover:bg-white/20 text-white" variant="secondary">
                  Bloquear Fechas
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 text-white" variant="secondary">
                  Editar Propiedad
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 text-white" variant="secondary">
                  Retirar Fondos
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <h3 className="text-lg font-semibold">Reservaciones</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setReservationFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    reservationFilter === "all"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setReservationFilter("PENDING")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    reservationFilter === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setReservationFilter("CONFIRMED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    reservationFilter === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Confirmadas
                </button>
                <button
                  type="button"
                  onClick={() => setReservationFilter("COMPLETED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    reservationFilter === "COMPLETED"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Completadas
                </button>
                <button
                  type="button"
                  onClick={() => setReservationFilter("CANCELLED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    reservationFilter === "CANCELLED"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Canceladas
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3">ID RESERVA</th>
                    <th className="px-6 py-3">HUESPED</th>
                    <th className="px-6 py-3">FECHAS</th>
                    <th className="px-6 py-3">DETALLES</th>
                    <th className="px-6 py-3">ESTADO</th>
                    <th className="px-6 py-3">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations
                    .filter((r) => {
                      const matchesSearch =
                        r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.reservationId.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesFilter = reservationFilter === "all" || r.status === reservationFilter;
                      return matchesSearch && matchesFilter;
                    })
                    .map((reservation) => (
                      <tr key={reservation.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {reservation.reservationId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">{reservation.guestName}</div>
                          {reservation.guestPhone && (
                            <div className="text-xs text-slate-500">{reservation.guestPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{reservation.dates}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">{reservation.pax}</div>
                          <div className="text-xs text-slate-500">${reservation.amount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(
                              reservation.status
                            )}`}
                          >
                            {statusLabel(reservation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button type="button" className="text-orange-600 hover:text-orange-700 hover:underline text-xs font-medium">
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {reservations.filter((r) => {
              const matchesSearch =
                r.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.reservationId.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesFilter = reservationFilter === "all" || r.status === reservationFilter;
              return matchesSearch && matchesFilter;
            }).length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-500 text-sm">No hay reservaciones que coincidan con tu búsqueda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "listings" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Mis anuncios</h3>
              <Link href="/create" className="text-sm text-orange-600 hover:underline">
                Publicar nuevo
              </Link>
            </div>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
              {listings.map((item) => (
                <HostListingCard
                  key={item.id}
                  imagePath={item.imagePath}
                  homeId={item.id}
                  price={item.price}
                  description={item.description}
                  stateValue={item.stateValue}
                  municipalityValue={item.municipalityValue}
                  title={item.title}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Analiticas</h3>
            <p className="text-sm text-slate-500 mt-2">
              Muy pronto tendras graficos detallados y reportes descargables.
            </p>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-semibold mb-6">Editar Perfil</h3>
              
              <form className="space-y-6">
                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 border-4 border-slate-100">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={96}
                        height={96}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      firstName?.[0]?.toUpperCase() || "H"
                    )}
                  </div>
                  <div>
                    <label htmlFor="profile-upload" className="block text-sm font-medium text-slate-700 mb-2">
                      Foto de Perfil
                    </label>
                    <input
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-orange-50 file:text-orange-600
                        hover:file:bg-orange-100"
                    />
                  </div>
                </div>

                <hr className="border-slate-200" />

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      defaultValue={firstName || ""}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-200 outline-none"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      defaultValue={lastName || ""}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-200 outline-none"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue={userEmail || ""}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    El email no se puede cambiar
                  </p>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estado / Región
                    </label>
                    <input
                      type="text"
                      defaultValue={country || ""}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-200 outline-none"
                      placeholder="Tu estado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      defaultValue={city || ""}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-200 outline-none"
                      placeholder="Tu ciudad"
                    />
                  </div>
                </div>

                {/* Bio/About */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Acerca de ti
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-orange-200 outline-none resize-none"
                    placeholder="Cuéntales a los huéspedes un poco sobre ti (máximo 500 caracteres)"
                    maxLength={500}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500">
                    Los cambios se guardarán automáticamente
                  </p>
                  <Button 
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
