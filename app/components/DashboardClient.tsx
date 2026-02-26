"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/app/action";
import HostListingCard from "@/app/components/HostListingCard";
import ListingCard from "@/app/components/ListingCard";
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

interface ReservationItem {
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

interface FavoriteItem {
  id: string;
  title: string;
  country: string;
  municipality: string | null;
  price: number;
  photo: string;
  favoriteId: string;
  description: string;
}

interface GuestReservationProperty {
  id: string;
  title: string;
  country: string;
  municipality: string | null;
  price: number;
  photo: string;
  description: string;
  favoriteId?: string;
  isInFavoriteList: boolean;
}

interface DashboardClientProps {
  role: "HOST" | "GUEST";
  userName?: string;
  userEmail?: string | null;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  country?: string | null;
  city?: string | null;
  profileImage?: string | null;
  initialTab?: string;
  
  // HOST specific
  stats?: HostStats;
  reservations?: ReservationItem[];
  listings?: HostListingItem[];
  
  // GUEST specific
  favorites?: FavoriteItem[];
  guestReservations?: GuestReservationProperty[];
}

const hostMenuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reservations", label: "Reservaciones", icon: CalendarCheck },
  { key: "listings", label: "Mis anuncios", icon: List },
  { key: "analytics", label: "Analíticas", icon: BarChart3 },
  { key: "profile", label: "Editar Perfil", icon: User },
];

const guestMenuItems = [
  { key: "favorites", label: "Mis Favoritos", icon: Heart },
  { key: "reservations", label: "Mis Reservas", icon: CalendarCheck },
  { key: "profile", label: "Editar Perfil", icon: User },
];

function statusLabel(status: ReservationItem["status"]) {
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

function statusStyle(status: ReservationItem["status"]) {
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

export default function DashboardClient({
  role,
  userName,
  userEmail,
  userId,
  firstName,
  lastName,
  country,
  city,
  profileImage,
  initialTab,
  stats,
  reservations = [],
  listings = [],
  favorites = [],
  guestReservations = [],
}: DashboardClientProps) {
  const defaultTab = initialTab || (role === "HOST" ? "dashboard" : "favorites");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [reservationFilter, setReservationFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = role === "HOST" ? hostMenuItems : guestMenuItems;

  const statCards = useMemo(
    () => [
      {
        label: "Ingresos Totales",
        value: `$${stats?.totalRevenue.toFixed(2) || "0.00"}`,
        note: "Bruto del mes",
        icon: DollarSign,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Comision ZERKKA",
        value: `-$${stats?.serviceFee.toFixed(2) || "0.00"}`,
        note: "Tarifa de servicio",
        icon: PieChart,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "Pendiente",
        value: `$${stats?.pendingAmount.toFixed(2) || "0.00"}`,
        note: "Reservas futuras",
        icon: CalendarDays,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
      },
      {
        label: "Disponible",
        value: `$${stats?.availableAmount.toFixed(2) || "0.00"}`,
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
      value: stats?.activeReservations || 0,
      note: "+2 vs mes anterior",
      icon: CalendarCheck,
      color: "text-blue-600",
    },
    {
      label: "Ocupacion Mes",
      value: `${stats?.occupancy || 0}%`,
      note: "+5% vs mes anterior",
      icon: PieChart,
      color: "text-green-600",
    },
    {
      label: "Calificacion",
      value: stats?.rating ? stats.rating.toFixed(1) : "-",
      note: stats?.ratingCount ? `+${stats.ratingCount} reseñas` : "Sin reseñas",
      icon: Star,
      color: "text-orange-600",
    },
    {
      label: "Solicitudes",
      value: stats?.requests || 0,
      note: "-1 vs mes anterior",
      icon: CalendarDays,
      color: "text-red-600",
    },
  ];

  const panelTitle = role === "HOST" ? "Host Panel" : "Mi Panel";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Botón cerrar en móvil */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 lg:hidden text-white/70 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">
              Z
            </div>
            <div>
              <p className="text-sm font-semibold">ZERKKA</p>
              <p className="text-xs text-white/60">{panelTitle}</p>
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
                onClick={() => {
                  setActiveTab(item.key);
                  setIsSidebarOpen(false);
                }}
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
              {userName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName || "Usuario"}</p>
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

      <main className="flex-1 w-full lg:w-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header con botón hamburguesa */}
          <div className="flex items-center justify-between mb-6 lg:mb-8 gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden h-10 w-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
              >
                <Menu size={20} className="text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                  {role === "HOST" ? "Bienvenido, " : ""}
                  {userName || "Usuario"}
                </h1>
                <p className="text-slate-600 text-xs md:text-sm">
                  {role === "HOST" ? "Gestiona tus propiedades y reservaciones" : "Administra tus favoritos y reservas"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>
              <button
                type="button"
                className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
              >
                <Bell size={18} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* HOST DASHBOARD TAB */}
          {activeTab === "dashboard" && role === "HOST" && (
            <div className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 md:p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                          <Icon size={20} className={stat.color} />
                        </div>
                      </div>
                      <p className="text-xl md:text-2xl font-bold text-slate-900 mb-1">{stat.value}</p>
                      <p className="text-sm text-slate-500 mb-0.5">{stat.label}</p>
                      <p className="text-xs text-slate-400">{stat.note}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {smallStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-100 bg-white shadow-sm p-3 md:p-4"
                    >
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <Icon size={18} className={stat.color} />
                        <p className="text-xs md:text-sm text-slate-500">{stat.label}</p>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.note}</p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-semibold">Reservaciones Recientes</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("reservations")}
                    className="text-xs md:text-sm text-orange-600 hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="space-y-2">
                  {reservations.slice(0, 3).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 md:p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                    >
                      <div className="flex-1">
                        <p className="text-sm md:text-base font-medium text-slate-900">{reservation.guestName}</p>
                        <p className="text-xs md:text-sm text-slate-500">{reservation.dates}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 md:px-2.5 py-1 text-xs font-semibold ${statusStyle(
                          reservation.status
                        )}`}
                      >
                        {statusLabel(reservation.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-4 md:py-6">
                  Ver Analíticas Detalladas
                </Button>
                <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 md:py-6">
                  Retirar Fondos
                </Button>
              </div>
            </div>
          )}

          {/* RESERVATIONS TAB */}
          {activeTab === "reservations" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="p-4 md:p-6 border-b border-slate-100">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <h3 className="text-base md:text-lg font-semibold">
                    {role === "HOST" ? "Reservaciones" : "Mis Reservas"}
                  </h3>
                  {role === "HOST" && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Buscar por nombre o ID"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="rounded-full border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-64"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {role === "HOST" && (
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
                )}
              </div>

              {role === "HOST" ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">ID RESERVA</th>
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">HUESPED</th>
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">FECHAS</th>
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">DETALLES</th>
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">ESTADO</th>
                          <th className="px-3 md:px-6 py-3 text-xs md:text-sm whitespace-nowrap">ACCIONES</th>
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
                              <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-slate-900 text-xs md:text-sm whitespace-nowrap">
                                {reservation.reservationId}
                              </td>
                              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                <div className="text-slate-900 font-medium text-xs md:text-sm">{reservation.guestName}</div>
                                {reservation.guestPhone && (
                                  <div className="text-xs text-slate-500">{reservation.guestPhone}</div>
                                )}
                              </td>
                              <td className="px-3 md:px-6 py-3 md:py-4 text-slate-700 text-xs md:text-sm whitespace-nowrap">{reservation.dates}</td>
                              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                <div className="text-slate-900 font-medium text-xs md:text-sm">{reservation.pax}</div>
                                <div className="text-xs text-slate-500">${reservation.amount.toFixed(2)}</div>
                              </td>
                              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 md:px-2.5 py-1 text-xs font-semibold ${statusStyle(
                                    reservation.status
                                  )}`}
                                >
                                  {statusLabel(reservation.status)}
                                </span>
                              </td>
                              <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
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
                    <div className="p-8 md:p-12 text-center">
                      <p className="text-slate-500 text-xs md:text-sm">No hay reservaciones que coincidan con tu búsqueda</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 md:p-6">
                  {guestReservations.length === 0 ? (
                    <div className="p-8 md:p-12 text-center">
                      <CalendarCheck className="mx-auto text-slate-300 mb-4" size={40} />
                      <p className="text-slate-900 font-semibold mb-2 text-sm md:text-base">No has realizado ninguna reserva aún</p>
                      <p className="text-slate-500 text-xs md:text-sm">Esperamos que llenes esto con los lugares que quieres visitar ❤️</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                      {guestReservations.map((item) => (
                        <ListingCard
                          key={item.id}
                          title={item.title}
                          stateValue={item.country}
                          municipalityValue={item.municipality}
                          price={item.price}
                          pathName="/my-dashboard"
                          homeId={item.id}
                          imagePath={item.photo}
                          userId={userId}
                          favoriteId={item.favoriteId || ""}
                          isInFavoriteList={item.isInFavoriteList}
                          description={item.description}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LISTINGS TAB (HOST only) */}
          {activeTab === "listings" && role === "HOST" && (
            <div>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold">Mis anuncios</h3>
                <Link href="/create" className="text-xs md:text-sm text-orange-600 hover:underline">
                  Publicar nuevo
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {listings.map((item) => (
                  <HostListingCard
                    key={item.id}
                    imagePath={item.imagePath}
                    homeId={item.id}
                    price={item.price}
                    title={item.title}
                    stateValue={item.stateValue}
                    municipalityValue={item.municipalityValue}
                    description={item.description}
                  />
                ))}
              </div>
              {listings.length === 0 && (
                <div className="p-8 md:p-12 text-center border border-dashed border-slate-300 rounded-2xl">
                  <List className="mx-auto text-slate-300 mb-4" size={40} />
                  <p className="text-slate-900 font-semibold mb-2 text-sm md:text-base">No tienes anuncios publicados</p>
                  <p className="text-slate-500 text-xs md:text-sm mb-4">Empieza a publicar tus propiedades</p>
                  <Link
                    href="/create"
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-full text-xs md:text-sm font-medium hover:bg-orange-700 transition"
                  >
                    Publicar primera propiedad
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* FAVORITES TAB (GUEST only) */}
          {activeTab === "favorites" && role === "GUEST" && (
            <div>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-semibold">Mis Favoritos</h3>
              </div>
              {favorites.length === 0 ? (
                <div className="p-8 md:p-12 text-center border border-dashed border-slate-300 rounded-2xl">
                  <Heart className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-900 font-semibold mb-2 text-sm md:text-base">No has guardado ninguna propiedad en tus favoritos</p>
                  <p className="text-slate-500 text-xs md:text-sm">Esperamos que llenes esto con los lugares que quieres visitar ❤️</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                  {favorites.map((item) => (
                    <ListingCard
                      key={item.id}
                      title={item.title}
                      stateValue={item.country}
                      municipalityValue={item.municipality}
                      price={item.price}
                      pathName="/my-dashboard"
                      homeId={item.id}
                      imagePath={item.photo}
                      userId={userId}
                      favoriteId={item.favoriteId}
                      isInFavoriteList={true}
                      description={item.description}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS TAB (HOST only) */}
          {activeTab === "analytics" && role === "HOST" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-8 md:p-12 text-center">
              <BarChart3 className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-900 font-semibold mb-2 text-sm md:text-base">Analíticas Avanzadas</p>
              <p className="text-slate-500 text-xs md:text-sm">Muy pronto tendrás gráficos detallados de tus propiedades</p>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="p-4 md:p-6 border-b border-slate-100">
                <h3 className="text-base md:text-lg font-semibold">Editar Perfil</h3>
              </div>

              <div className="p-4 md:p-6">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                    <div className="relative">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-slate-100"
                        />
                      ) : (
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold border-4 border-slate-100">
                          {firstName?.[0]?.toUpperCase() || userName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md border border-slate-200 hover:bg-slate-50"
                      >
                        <svg
                          className="w-4 h-4 text-slate-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/*"
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePicture"
                        className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium cursor-pointer transition"
                      >
                        Cambiar foto
                      </label>
                      <p className="text-xs text-slate-500 mt-2">JPG, PNG o GIF. Max 5MB</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                          Nombre
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          defaultValue={firstName || ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                          Apellido
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          defaultValue={lastName || ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        defaultValue={userEmail || ""}
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">El email no se puede cambiar</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
                          Estado / Región
                        </label>
                        <input
                          type="text"
                          id="country"
                          defaultValue={country || ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-2">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          id="city"
                          defaultValue={city || ""}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                        Acerca de ti
                      </label>
                      <textarea
                        id="bio"
                        rows={4}
                        maxLength={500}
                        placeholder="Cuéntanos sobre ti..."
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none resize-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Máximo 500 caracteres</p>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-slate-500">
                        Los cambios se guardarán automáticamente
                      </p>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
