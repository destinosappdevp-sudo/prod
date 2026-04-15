"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { buildHomeUrl } from "@/app/lib/slug";
import {
  CalendarCheck,
  User,
  LogOut,
  Heart,
  PiggyBank,
  PlusCircle,
  Smartphone,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/app/action";
import ProfileEditClient from "@/app/components/ProfileEditClient";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import { BANKS } from "@/app/lib/paymentBanks";

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

interface SavingItem {
  id: string;
  date: string | Date;
  bcvRate: number;
  amountBs: number;
  amountUsd: number;
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
  savings?: SavingItem[];
  savingsTotal?: number;
  bcvRate?: number;
  userData?: any;
  initialDocs?: any[];
}

export default function DashboardClient(props: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(props.initialTab || "reservations");
  const [amountUsd, setAmountUsd] = useState("");
  const [emisorBank, setEmisorBank] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const previewBs =
    amountUsd && props.bcvRate && props.bcvRate > 0
      ? Math.round(Number(amountUsd) * props.bcvRate * 100) / 100
      : null;

  const phoneValid = /^\+?\d{7,14}$/.test(phoneNumber);

  const normalizePhone = (value: string) => {
    const hasLeadingPlus = value.startsWith("+");
    const digitsOnly = value.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`.slice(0, 14);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    const usd = Number(amountUsd);
    if (!usd || usd <= 0) {
      setSaveError("Ingresa un monto válido en USD.");
      return;
    }
    if (!previewBs) {
      setSaveError("Tasa BCV no disponible.");
      return;
    }
    if (!emisorBank) {
      setSaveError("Selecciona tu banco emisor.");
      return;
    }
    if (!phoneValid) {
      setSaveError("Ingresa un número de teléfono válido.");
      return;
    }
    if (!referenceNumber.trim()) {
      setSaveError("Ingresa el número de referencia.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountBs: previewBs,
          paymentDetails: { emisorBank, phoneNumber, referenceNumber: referenceNumber.trim() },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as any).error || "Error al guardar");
      } else {
        setSaveSuccess(true);
        setAmountUsd("");
        setEmisorBank("");
        setPhoneNumber("");
        setReferenceNumber("");
        router.refresh();
      }
    } catch {
      setSaveError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  const profileUserData = props.userData || {
    firstName: props.firstName || "",
    lastName: props.lastName || "",
    phoneNumber: props.phoneNumber || "",
    profileImage: props.profileImage || null,
    email: props.userEmail || "",
    role: "GUEST",
  };

  const displayName = (
    props.firstName ||
    props.userName ||
    props.userEmail?.split("@")[0] ||
    "Viajero"
  ).trim();
  const firstDisplayName = displayName.split(" ")[0] || "Viajero";
  const userInitials = (displayName || "V")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "V";

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
    { key: "mi-alcancia",  label: "Mi Alcancía",    icon: PiggyBank },
    { key: "ahorrar",      label: "Ahorrar",        icon: PlusCircle },
    { key: "profile",      label: "Perfil",         icon: User },
  ];
  const activeMenuLabel = menuItems.find((item) => item.key === activeTab)?.label || "Mi Escritorio";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-blue text-white transition-transform duration-200 lg:static lg:w-64 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">D</div>
            <div>
              <p className="text-sm font-semibold">Destinos Venezuela</p>
              <p className="text-xs text-white/60">Panel de Cliente</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 py-6 space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveTab(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 text-left transition-colors ${
                  isActive ? "text-white" : "text-white/70 hover:text-white"
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
              <p className="text-sm font-semibold">{props.userName || "Cliente"}</p>
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
      <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-8 lg:pt-8">
        <div className="sticky top-[96px] z-20 mb-4 flex items-center justify-end rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#E0AE33]/30 bg-[#F7E7B6] text-xs font-bold text-[#8A6500]">
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
              userInitials
            )}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {activeTab === "reservations" && "Dashboard"}
            {activeTab === "favorites" && "Mis Favoritos"}
            {activeTab === "mi-alcancia" && "Mi Alcancía"}
            {activeTab === "ahorrar" && "Ahorrar"}
            {activeTab === "profile" && "Editar Perfil"}
          </h1>
          <p className="text-sm text-slate-500">
            {activeTab === "reservations" && "Explora, reserva y gestiona tus alojamientos"}
            {activeTab === "favorites" && "Alojamientos que guardaste"}
            {activeTab === "mi-alcancia" && "Historial de tus ahorros"}
            {activeTab === "ahorrar" && "Deposita a tu alcancía de viajes"}
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
                <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:underline">Explorar paquetes</Link>
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
                <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:underline">Explorar paquetes</Link>
              </div>
            )}
          </div>
        )}

        {/* MI ALCANCÍA */}
        {activeTab === "mi-alcancia" && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs text-slate-500 mb-1">Total ahorrado (USD)</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(props.savingsTotal ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs text-slate-500 mb-1">Movimientos</p>
                <p className="text-3xl font-bold text-slate-800">
                  {props.savings?.length ?? 0}
                </p>
              </div>
            </div>

            {/* Savings table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              {props.savings && props.savings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Tasa BCV</th>
                        <th className="px-6 py-3">Monto Bs.</th>
                        <th className="px-6 py-3">Monto USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.savings.map((s, index) => (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                            {props.savings!.length - index}
                          </td>
                          <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                            {formatDate(s.date)}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-mono">
                            {Number(s.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-semibold font-mono">
                            Bs. {Number(s.amountBs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-green-700 font-semibold font-mono">
                            ${Number(s.amountUsd).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <PiggyBank className="mx-auto mb-3 text-slate-300" size={48} />
                  <p className="text-slate-500">Aún no tienes ahorros registrados.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ahorrar")}
                    className="mt-4 inline-block text-sm text-orange-600 hover:underline"
                  >
                    Comenzar a ahorrar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AHORRAR */}
        {activeTab === "ahorrar" && (
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Card estilo mobile */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <PiggyBank size={28} />
                    <h2 className="text-xl font-bold">Depositar a Mi Alcancía</h2>
                  </div>
                  <p className="text-sm text-white/80">
                    {props.bcvRate && props.bcvRate > 0
                      ? `Tasa BCV del día: ${Number(props.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD`
                      : "Tasa BCV no disponible"}
                  </p>
                </div>

                <div className="px-6 py-6">
                  <form onSubmit={handleSave} className="space-y-5">
                    {/* Monto USD */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Monto en Dólares (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amountUsd}
                          onChange={(e) => {
                            setAmountUsd(e.target.value);
                            setSaveError("");
                            setSaveSuccess(false);
                          }}
                          placeholder="0.00"
                          className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {/* Preview Bs */}
                    {previewBs && (
                      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                        <p className="text-xs text-slate-500 mb-0.5">Monto a abonar en Bs.</p>
                        <p className="text-2xl font-bold text-orange-600">
                          Bs. {previewBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}

                    {/* Receptor info */}
                    <div className="bg-blue-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone size={14} className="text-blue-600" />
                        <p className="text-xs font-semibold text-blue-700">Información del receptor (Pago Móvil)</p>
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <p><span className="font-medium">Banco:</span> 0102 — Banco de Venezuela</p>
                        <p><span className="font-medium">Teléfono:</span> 0414-1234567</p>
                        <p><span className="font-medium">Cédula:</span> V-12345678</p>
                        {previewBs && (
                          <p className="font-semibold text-blue-800 mt-1">
                            Monto: Bs. {previewBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Banco emisor */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tu Banco Emisor</label>
                      <select
                        value={emisorBank}
                        onChange={(e) => { setEmisorBank(e.target.value); setSaveError(""); }}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      >
                        <option value="">Seleccionar...</option>
                        {BANKS.map((bank) => (
                          <option key={bank.value} value={bank.value}>
                            {bank.code} — {bank.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${phoneNumber && !phoneValid ? "text-red-600" : "text-slate-700"}`}>
                        Tu Teléfono
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        maxLength={14}
                        placeholder="+584141234567"
                        value={phoneNumber}
                        onChange={(e) => { setPhoneNumber(normalizePhone(e.target.value)); setSaveError(""); }}
                        required
                        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          phoneNumber && !phoneValid ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                    </div>

                    {/* Referencia */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Número de referencia</label>
                      <input
                        type="text"
                        placeholder="123456"
                        value={referenceNumber}
                        onChange={(e) => { setReferenceNumber(e.target.value); setSaveError(""); }}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {saveError && (
                      <p className="text-sm text-red-600">{saveError}</p>
                    )}

                    {saveSuccess && (
                      <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                        <p className="text-sm text-green-700 font-medium">¡Depósito registrado correctamente!</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("mi-alcancia")}
                          className="text-xs text-green-600 hover:underline mt-1"
                        >
                          Ver Mi Alcancía →
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving || !amountUsd || !previewBs}
                      className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? "Procesando..." : "Registrar Depósito"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
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
