"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buildHomeUrl } from "@/app/lib/slug";
import {
  CalendarCheck,
  User,
  LogOut,
  Heart,
} from "lucide-react";
import { signOut } from "@/app/action";
import ProfileEditClient from "@/app/components/ProfileEditClient";
import { SupabaseImage } from "@/app/components/SupabaseImage";

interface GuestReservationItem {
  id: string;
  homeId?: string;
  title: string;
  country: string;
  municipality?: string | null;
  price: number;
  photo: string;
  description: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status?: string | null;
  totalAmount?: number | null;
  favoriteId?: string;
  isInFavoriteList?: boolean;
}

interface FavoriteItem {
  id: string;
  title: string;
  country: string;
  municipality?: string | null;
  price: number;
  photo: string;
  description: string;
  favoriteId?: string;
}

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
  favorites?: FavoriteItem[];
  guestReservations?: GuestReservationItem[];
  userData?: any;
  initialDocs?: any[];
}

export default function DashboardClient(props: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState(props.initialTab || "reservations");

  const profileUserData = props.userData || {
    firstName: props.firstName || "",
    lastName: props.lastName || "",
    phoneNumber: props.phoneNumber || "",
    profileImage: props.profileImage || null,
    email: props.userEmail || "",
    role: "GUEST",
  };

  function statusLabel(status?: string | null) {
    switch (status) {
      case "CONFIRMED": return "Confirmada";
      case "PENDING":   return "Pendiente";
      case "CANCELLED": return "Cancelada";
      case "COMPLETED": return "Completada";
      default:          return status ?? "—";
    }
  }

  function statusStyle(status?: string | null) {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING":   return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      default:          return "bg-gray-100 text-gray-700";
    }
  }

  function formatDate(d?: string | Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }

  const menuItems = [
    { key: "reservations", label: "Mis Reservas",  icon: CalendarCheck },
    { key: "favorites",    label: "Favoritos",      icon: Heart },
    { key: "profile",      label: "Perfil",         icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">D</div>
            <div>
              <p className="text-sm font-semibold">Destinos Venezuela</p>
              <p className="text-xs text-white/60">Panel de Huésped</p>
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
                  isActive ? "bg-orange-500 text-white" : "text-white/70 hover:bg-white/10 hover:text-primary"
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
            <div className="h-9 w-9 rounded-full overflow-hidden bg-white/10 flex items-center justify-center text-sm">
              {props.profileImage ? (
                <Image
                  src={props.profileImage}
                  alt="Foto de perfil"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                props.userName?.[0]?.toUpperCase() || "G"
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{props.userName || "Huésped"}</p>
              <p className="text-xs text-white/60 truncate">{props.userEmail || ""}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/10 hover:text-primary transition"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === "reservations" && "Dashboard Huésped"}
            {activeTab === "favorites" && "Mis Favoritos"}
            {activeTab === "profile" && "Editar Perfil"}
          </h1>
          <p className="text-sm text-slate-500">
            {activeTab === "reservations" && "Explora, reserva y gestiona tus alojamientos"}
            {activeTab === "favorites" && "Alojamientos que guardaste"}
            {activeTab === "profile" && "Actualiza tus datos personales"}
          </p>
        </div>

        {/* MIS RESERVAS */}
        {activeTab === "reservations" && (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {props.guestReservations && props.guestReservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-3">Alojamiento</th>
                      <th className="px-6 py-3">Fechas</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.guestReservations.map((res) => (
                      <tr key={res.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                              {res.photo ? (
                                <SupabaseImage
                                  imagePath={res.photo}
                                  alt={res.title}
                                  fill
                                  className="object-cover"
                                />
                              ) : null}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{res.title}</div>
                              <div className="text-xs text-slate-500">{res.country}{res.municipality ? `, ${res.municipality}` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                          {formatDate(res.startDate)} → {formatDate(res.endDate)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {res.totalAmount != null ? `$${Number(res.totalAmount).toFixed(2)}` : `$${res.price.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(res.status)}`}>
                            {statusLabel(res.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/reservation/${res.id}`} className="text-orange-600 hover:underline text-xs font-medium">
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <CalendarCheck className="mx-auto mb-3 text-slate-300" size={48} />
                <p className="text-slate-500">No tienes reservas aún.</p>
                <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:underline">Explorar alojamientos</Link>
              </div>
            )}
          </div>
        )}

        {/* FAVORITOS */}
        {activeTab === "favorites" && (
          <div>
            {props.favorites && props.favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {props.favorites.map((fav) => (
                  <div key={fav.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition">
                    <div className="relative h-36 bg-slate-100">
                      {fav.photo ? (
                        <SupabaseImage imagePath={fav.photo} alt={fav.title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <div className="font-semibold text-slate-900">{fav.title}</div>
                      <div className="text-sm text-slate-500">{fav.country}{fav.municipality ? `, ${fav.municipality}` : ""}</div>
                      <div className="mt-2 text-orange-600 font-bold">${fav.price}</div>
                      <Link href={buildHomeUrl((fav as any).slug, fav.id, (fav as any).categoryName)} className="mt-3 block text-center text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl py-2 transition">
                        Ver alojamiento
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <Heart className="mx-auto mb-3 text-slate-300" size={48} />
                <p className="text-slate-500">No tienes favoritos guardados.</p>
                <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:underline">Explorar alojamientos</Link>
              </div>
            )}
          </div>
        )}

        {/* PERFIL */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-6">
            <ProfileEditClient
              userData={profileUserData}
              userId={props.userId || ""}
              initialDocs={props.initialDocs || []}
            />
          </div>
        )}
      </main>
    </div>
  );
}
