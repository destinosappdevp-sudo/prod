"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Lock,
  Wallet,
  X,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowDownToLine,
} from "lucide-react";
import { signOut } from "@/app/action";
import HostListingCard from "@/app/components/HostListingCard";
import ProfileEditClient from "@/app/components/ProfileEditClient";
import { Button } from "@/components/ui/button";

interface HostStats {
  walletUsd: {
    totalRevenue: number;
    serviceFee: number;
    pendingAmount: number;
    availableAmount: number;
  };
  walletBs: {
    totalRevenue: number;
    serviceFee: number;
    pendingAmount: number;
    availableAmount: number;
  };
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
  amountCurrency: "USD" | "VES";
  amountLabel: string;
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
  publishStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  approvalRejectionReason?: string | null;
}

interface HostAnalyticsPeriod {
  labels: string[];
  revenueUsd: number[];
  bookings: number[];
  grossRevenueUsd: number;
  commissionUsd: number;
  netRevenueUsd: number;
  totalBookings: number;
  averageTicketUsd: number;
  maxRevenue: number;
  maxBookings: number;
  bestBookingIndex: number;
  bestPeriodLabel: string;
  rangeLabel: string;
}

interface HostAnalyticsData {
  weekly: HostAnalyticsPeriod;
  monthly: HostAnalyticsPeriod;
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
  analytics: HostAnalyticsData;
  initialTab?: string;
  createHomeAction?: (formData: FormData) => Promise<void>;
  userData?: any;
  userId?: string;
  initialDocs?: any[];
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
  analytics,
  initialTab,
  createHomeAction,
  userData,
  userId,
  initialDocs = [],
}: HostDashboardClientProps) {
  const [activeTab, setActiveTab] = useState(() => {
    const allowedTabs = new Set(menuItems.map((item) => item.key));
    if (initialTab && allowedTabs.has(initialTab)) {
      return initialTab;
    }
    return "dashboard";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [reservationFilter, setReservationFilter] = useState<"all" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED">("all");
  const [analyticsRange, setAnalyticsRange] = useState<"weekly" | "monthly">("weekly");
  const displayName = (firstName || userName || userEmail?.split("@")[0] || "Anfitri�n").trim();
  const firstDisplayName = displayName.split(" ")[0] || "Anfitri�n";
  const userInitials = (displayName || "A")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "A";

  // -- Modal Bloquear Fechas -------------------------------------------------
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockForm, setBlockForm] = useState({
    homeId: listings[0]?.id ?? "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockMsg, setBlockMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const blockFetched = useRef<string | null>(null);

  const fetchBlockedDates = useCallback(async (homeId: string) => {
    if (!homeId) return;
    try {
      const res = await fetch(`/api/host/blocked-dates?homeId=${encodeURIComponent(homeId)}`);
      const json = await res.json();
      if (json.blocked) setBlockedDates(json.blocked);
    } catch {}
  }, []);

  useEffect(() => {
    if (showBlockModal && blockForm.homeId && blockFetched.current !== blockForm.homeId) {
      blockFetched.current = blockForm.homeId;
      fetchBlockedDates(blockForm.homeId);
    }
  }, [showBlockModal, blockForm.homeId, fetchBlockedDates]);

  const handleBlockDateChange = (field: string, value: string) => {
    setBlockForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "homeId") {
        blockFetched.current = null;
        setBlockedDates([]);
      }
      return next;
    });
  };

  const submitBlockDate = async () => {
    setBlockMsg(null);
    setBlockLoading(true);
    try {
      const res = await fetch("/api/host/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setBlockMsg({ ok: false, text: json.error ?? "No se pudo bloquear" });
      } else {
        setBlockMsg({ ok: true, text: "Fechas bloqueadas exitosamente" });
        setBlockForm((p) => ({ ...p, startDate: "", endDate: "", reason: "" }));
        blockFetched.current = null;
        fetchBlockedDates(blockForm.homeId);
      }
    } catch {
      setBlockMsg({ ok: false, text: "Error de conexi�n" });
    } finally {
      setBlockLoading(false);
    }
  };

  const deleteBlockedDate = async (id: string) => {
    try {
      const res = await fetch(`/api/host/blocked-dates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBlockedDates((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {}
  };

  // -- Modal Retirar Fondos --------------------------------------------------
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawCurrency, setWithdrawCurrency] = useState<"USD" | "VES">("USD");
  const [withdrawData, setWithdrawData] = useState<any>(null);
  const [withdrawDataLoading, setWithdrawDataLoading] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    paymentMethod: "ZELLE",
    holderName: "",
    bankName: "",
    phoneNumber: "",
    accountNumber: "",
  });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchWithdrawData = useCallback(async () => {
    setWithdrawDataLoading(true);
    try {
      const res = await fetch("/api/host/withdrawals");
      const json = await res.json();
      if (res.ok) {
        setWithdrawData(json);
        const available = Number(json?.wallets?.[withdrawCurrency]?.availableToWithdraw ?? 0);
        setWithdrawForm((p) => ({ ...p, amount: available.toFixed(2) }));
      }
    } catch {}
    setWithdrawDataLoading(false);
  }, [withdrawCurrency]);

  useEffect(() => {
    if (!withdrawData?.wallets) {
      return;
    }

    const available = Number(withdrawData.wallets?.[withdrawCurrency]?.availableToWithdraw ?? 0);
    setWithdrawForm((p) => ({
      ...p,
      amount: available.toFixed(2),
      paymentMethod:
        withdrawCurrency === "VES"
          ? p.paymentMethod === "PAGO_MOVIL" || p.paymentMethod === "TRANSFERENCIA"
            ? p.paymentMethod
            : "PAGO_MOVIL"
          : p.paymentMethod === "ZELLE" || p.paymentMethod === "TRANSFERENCIA"
          ? p.paymentMethod
          : "ZELLE",
    }));
  }, [withdrawCurrency, withdrawData]);

  useEffect(() => {
    if (showWithdrawModal && !withdrawData) {
      fetchWithdrawData();
    }
  }, [showWithdrawModal, withdrawData, fetchWithdrawData]);

  const submitWithdrawal = async () => {
    setWithdrawMsg(null);
    setWithdrawLoading(true);
    const paymentDetails: Record<string, string> = {};
    if (withdrawForm.holderName) paymentDetails.holderName = withdrawForm.holderName;
    if (withdrawForm.bankName) paymentDetails.bankName = withdrawForm.bankName;
    if (withdrawForm.phoneNumber) paymentDetails.phoneNumber = withdrawForm.phoneNumber;
    if (withdrawForm.accountNumber) paymentDetails.accountNumber = withdrawForm.accountNumber;
    try {
      const res = await fetch("/api/host/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          currency: withdrawCurrency,
          paymentMethod: withdrawForm.paymentMethod,
          paymentDetails,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setWithdrawMsg({ ok: false, text: json.error ?? "No se pudo solicitar" });
      } else {
        setWithdrawMsg({ ok: true, text: "�Solicitud enviada! El equipo la procesar� pronto." });
        fetchWithdrawData();
      }
    } catch {
      setWithdrawMsg({ ok: false, text: "Error de conexi�n" });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const statCards = useMemo(
    () => [
      {
        label: "Ingresos Totales (USD)",
        value: `$${stats.walletUsd.totalRevenue.toFixed(2)}`,
        note: `Comisi�n: $${stats.walletUsd.serviceFee.toFixed(2)}`,
        icon: DollarSign,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Disponible (USD)",
        value: `$${stats.walletUsd.availableAmount.toFixed(2)}`,
        note: `Pendiente: $${stats.walletUsd.pendingAmount.toFixed(2)}`,
        icon: PieChart,
        color: "text-orange-600",
        bg: "bg-orange-50",
      },
      {
        label: "Ingresos Totales (Bs)",
        value: `Bs ${stats.walletBs.totalRevenue.toFixed(2)}`,
        note: `Comisi�n: Bs ${stats.walletBs.serviceFee.toFixed(2)}`,
        icon: CalendarDays,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        label: "Disponible (Bs)",
        value: `Bs ${stats.walletBs.availableAmount.toFixed(2)}`,
        note: `Pendiente: Bs ${stats.walletBs.pendingAmount.toFixed(2)}`,
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
      note: stats.ratingCount ? `+${stats.ratingCount} rese�as` : "Sin rese�as",
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

  const selectedAnalytics =
    analyticsRange === "weekly" ? analytics.weekly : analytics.monthly;
  const analyticsDateRangeLabel = selectedAnalytics.rangeLabel;
  const analyticsGrossRevenue = selectedAnalytics.grossRevenueUsd;
  const analyticsCommission = selectedAnalytics.commissionUsd;
  const analyticsNetRevenue = selectedAnalytics.netRevenueUsd;
  const analyticsTotalBookings = selectedAnalytics.totalBookings;
  const analyticsAverageTicket = selectedAnalytics.averageTicketUsd;
  const analyticsBestPeriodLabel = selectedAnalytics.bestPeriodLabel || "-";

  const lineChartGeometry = useMemo(() => {
    const width = 640;
    const height = 260;
    const leftPadding = 44;
    const rightPadding = 16;
    const topPadding = 16;
    const bottomPadding = 30;

    const usableWidth = width - leftPadding - rightPadding;
    const usableHeight = height - topPadding - bottomPadding;
    const stepX =
      selectedAnalytics.labels.length > 1
        ? usableWidth / (selectedAnalytics.labels.length - 1)
        : 0;

    const points = selectedAnalytics.revenueUsd.map((value, index) => {
      const x = leftPadding + stepX * index;
      const y =
        topPadding + (1 - value / Math.max(selectedAnalytics.maxRevenue, 1)) * usableHeight;
      return { x, y, value };
    });

    const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
    const lastPointX = points[points.length - 1]?.x ?? leftPadding;
    const areaPath = `${leftPadding},${height - bottomPadding} ${polyline} ${lastPointX},${
      height - bottomPadding
    }`;

    const yTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({
      y: topPadding + (1 - ratio) * usableHeight,
      value: Math.round(Math.max(selectedAnalytics.maxRevenue, 1) * ratio),
    }));

    return {
      width,
      height,
      leftPadding,
      rightPadding,
      topPadding,
      bottomPadding,
      points,
      polyline,
      areaPath,
      yTicks,
    };
  }, [selectedAnalytics]);

  const recentReservations = useMemo(() => reservations.slice(0, 6), [reservations]);

  const reservationStatusCounts = useMemo(() => {
    const counts = {
      all: reservations.length,
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const reservation of reservations) {
      if (reservation.status === "PENDING") counts.PENDING += 1;
      if (reservation.status === "CONFIRMED") counts.CONFIRMED += 1;
      if (reservation.status === "COMPLETED") counts.COMPLETED += 1;
      if (reservation.status === "CANCELLED") counts.CANCELLED += 1;
    }

    return counts;
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        reservation.guestName.toLowerCase().includes(normalizedSearch) ||
        reservation.reservationId.toLowerCase().includes(normalizedSearch);

      const matchesFilter =
        reservationFilter === "all" || reservation.status === reservationFilter;

      return matchesSearch && matchesFilter;
    });
  }, [reservations, reservationFilter, searchTerm]);

  const selectedWithdrawWallet =
    withdrawData?.wallets?.[withdrawCurrency] ?? {
      totalEarned: 0,
      totalWithdrawn: 0,
      availableToWithdraw: 0,
      pendingRelease: 0,
    };

  const withdrawCurrencyLabel = withdrawCurrency === "USD" ? "USD" : "Bs";
  const withdrawCurrencyPrefix = withdrawCurrency === "USD" ? "$" : "Bs ";
  const allowedWithdrawMethods =
    withdrawCurrency === "VES"
      ? (["PAGO_MOVIL", "TRANSFERENCIA"] as const)
      : (["ZELLE", "TRANSFERENCIA"] as const);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-brand-blue text-white flex flex-col">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">
              Z
            </div>
            <div>
              <p className="text-sm font-semibold">Destinos Venezuela</p>
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
                    : "text-white/70 hover:bg-white/10 hover:text-primary"
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
              {profileImage && !profileImage.includes('avatar.vercel.sh') ? (
                <Image
                  src={profileImage}
                  alt="avatar"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                firstName?.[0]?.toUpperCase() || userName?.[0]?.toUpperCase() || "H"
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName || "Anfitrion"}</p>
              <p className="text-xs text-white/60">{userEmail || ""}</p>
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

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="sticky top-3 z-20 mb-6 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Bienvenido,</p>
              <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                Hola, {firstDisplayName}! ??
              </h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#E0AE33]/30 bg-[#F7E7B6] text-sm font-bold text-[#8A6500]">
              {profileImage && !profileImage.includes('avatar.vercel.sh') ? (
                <Image
                  src={profileImage}
                  alt="avatar"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                userInitials
              )}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Anfitri�n</h2>
          <p className="text-sm text-slate-500">Gestiona tus propiedades y reservas</p>
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
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Fechas</th>
                      <th className="py-2">PAX</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReservations.map((reservation) => (
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
              <h3 className="text-lg font-semibold">Acciones de Anfitri�n</h3>
              <p className="text-sm text-white/70 mt-1">Gestiona tus propiedades y fondos</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => { setShowBlockModal(true); setBlockMsg(null); }}
                  className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 text-sm font-medium transition"
                >
                  <Lock size={16} />
                  Bloquear Fechas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawCurrency("USD");
                    setShowWithdrawModal(true);
                    setWithdrawMsg(null);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 text-sm font-medium transition"
                >
                  <Wallet size={16} />
                  Retirar Fondos
                  {(stats.walletUsd.availableAmount > 0 || stats.walletBs.availableAmount > 0) && (
                    <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                      USD ${stats.walletUsd.availableAmount.toFixed(0)} � Bs {stats.walletBs.availableAmount.toFixed(0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* --- Modal Bloquear Fechas ----------------------------------- */}
            {showBlockModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Lock size={18} className="text-slate-700" />
                      <h2 className="text-lg font-semibold text-slate-900">Bloquear Fechas</h2>
                    </div>
                    <button type="button" onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-slate-700 transition">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {listings.length === 0 ? (
                      <p className="text-sm text-slate-500">No tienes propiedades a�n.</p>
                    ) : (
                      <>
                        {/* Selector de propiedad */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Propiedad
                          </label>
                          <select
                            value={blockForm.homeId}
                            onChange={(e) => handleBlockDateChange("homeId", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
                          >
                            {listings.map((l) => (
                              <option key={l.id} value={l.id}>{l.title || "Sin t�tulo"}</option>
                            ))}
                          </select>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Desde</label>
                            <input
                              type="date"
                              value={blockForm.startDate}
                              min={new Date().toISOString().split("T")[0]}
                              onChange={(e) => handleBlockDateChange("startDate", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hasta</label>
                            <input
                              type="date"
                              value={blockForm.endDate}
                              min={blockForm.startDate || new Date().toISOString().split("T")[0]}
                              onChange={(e) => handleBlockDateChange("endDate", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
                            />
                          </div>
                        </div>

                        {/* Motivo */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Motivo (opcional)</label>
                          <input
                            type="text"
                            placeholder="Ej. Mantenimiento, uso personal�"
                            value={blockForm.reason}
                            onChange={(e) => handleBlockDateChange("reason", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-slate-300 outline-none"
                          />
                        </div>

                        {blockMsg && (
                          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                            blockMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {blockMsg.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {blockMsg.text}
                          </div>
                        )}

                        <Button
                          type="button"
                          disabled={blockLoading || !blockForm.startDate || !blockForm.endDate}
                          onClick={submitBlockDate}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                        >
                          {blockLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <Lock size={16} className="mr-2" />}
                          Bloquear per�odo
                        </Button>

                        {/* Listado de bloqueos existentes */}
                        {blockedDates.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Per�odos bloqueados</p>
                            <div className="space-y-2">
                              {blockedDates.map((b: any) => (
                                <div key={b.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                                  <div>
                                    <p className="text-sm font-medium text-slate-800">
                                      {new Date(b.startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                      {" � "}
                                      {new Date(b.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                    {b.reason && <p className="text-xs text-slate-500">{b.reason}</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => deleteBlockedDate(b.id)}
                                    className="ml-3 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- Modal Retirar Fondos ------------------------------------ */}
            {showWithdrawModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-2 text-white">
                      <Wallet size={18} />
                      <h2 className="text-lg font-semibold">Retirar Fondos</h2>
                    </div>
                    <button type="button" onClick={() => setShowWithdrawModal(false)} className="text-white/60 hover:text-white transition">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="max-h-[80vh] overflow-y-auto">
                    {withdrawDataLoading ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 size={28} className="animate-spin text-slate-400" />
                      </div>
                    ) : withdrawData ? (
                      <>
                        {/* Balance cards */}
                        <div className="border-b border-slate-100">
                          <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setWithdrawCurrency("USD");
                                setWithdrawMsg(null);
                              }}
                              className={`p-5 text-left transition ${
                                withdrawCurrency === "USD" ? "bg-slate-50" : "bg-white hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-xs text-slate-500 mb-1">Disponible USD</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                ${Number(withdrawData.wallets?.USD?.availableToWithdraw ?? 0).toFixed(2)}
                              </p>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWithdrawCurrency("VES");
                                setWithdrawMsg(null);
                              }}
                              className={`p-5 text-left border-l border-slate-100 transition ${
                                withdrawCurrency === "VES" ? "bg-slate-50" : "bg-white hover:bg-slate-50"
                              }`}
                            >
                              <p className="text-xs text-slate-500 mb-1">Disponible Bs</p>
                              <p className="text-2xl font-bold text-blue-600">
                                Bs {Number(withdrawData.wallets?.VES?.availableToWithdraw ?? 0).toFixed(2)}
                              </p>
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-0">
                            <div className="p-4 text-center border-r border-slate-100">
                              <p className="text-xs text-slate-500 mb-1">Ganado ({withdrawCurrencyLabel})</p>
                              <p className="text-lg font-bold text-slate-900">
                                {withdrawCurrencyPrefix}{(selectedWithdrawWallet.totalEarned ?? 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="p-4 text-center border-r border-slate-100">
                              <p className="text-xs text-slate-500 mb-1">Retirado ({withdrawCurrencyLabel})</p>
                              <p className="text-lg font-bold text-orange-600">
                                {withdrawCurrencyPrefix}{(selectedWithdrawWallet.totalWithdrawn ?? 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="p-4 text-center">
                              <p className="text-xs text-slate-500 mb-1">Pendiente ({withdrawCurrencyLabel})</p>
                              <p className="text-lg font-bold text-slate-600">
                                {withdrawCurrencyPrefix}{(selectedWithdrawWallet.pendingRelease ?? 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedWithdrawWallet.availableToWithdraw <= 0 ? (
                          <div className="px-6 py-8 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                              <Clock size={24} className="text-slate-400" />
                            </div>
                            <p className="font-semibold text-slate-700">Sin fondos disponibles</p>
                            <p className="text-sm text-slate-500 mt-1">
                              Los fondos se liberan una vez que finaliza la estad�a del hu�sped.
                            </p>
                          </div>
                        ) : (
                          <div className="px-6 py-5 space-y-4">
                            {/* Monto */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Monto a retirar ({withdrawCurrencyLabel})
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                                  {withdrawCurrency === "USD" ? "$" : "Bs"}
                                </span>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={selectedWithdrawWallet.availableToWithdraw}
                                  value={withdrawForm.amount}
                                  onChange={(e) => setWithdrawForm((p) => ({ ...p, amount: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                />
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                M�ximo disponible: <strong>{withdrawCurrencyPrefix}{(selectedWithdrawWallet.availableToWithdraw ?? 0).toFixed(2)}</strong>
                              </p>
                            </div>

                            {/* M�todo de pago */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">M�todo de cobro</label>
                              <div className="grid grid-cols-2 gap-2 text-center text-sm">
                                {allowedWithdrawMethods.map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setWithdrawForm((p) => ({ ...p, paymentMethod: m }))}
                                    className={`rounded-xl border py-2.5 font-medium transition text-xs ${
                                      withdrawForm.paymentMethod === m
                                        ? "border-orange-500 bg-orange-50 text-orange-700"
                                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {m === "PAGO_MOVIL"
                                      ? "Pago M�vil"
                                      : m === "ZELLE"
                                      ? "Zelle"
                                      : "Transferencia"}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {withdrawCurrency === "USD"
                                  ? "Para USD puedes retirar por Zelle o Transferencia."
                                  : "Para Bs puedes retirar por Pago M�vil o Transferencia."}
                              </p>
                            </div>

                            {/* Detalles del pago */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Nombre del titular</label>
                                <input
                                  type="text"
                                  placeholder="Juan P�rez"
                                  value={withdrawForm.holderName}
                                  onChange={(e) => setWithdrawForm((p) => ({ ...p, holderName: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                />
                              </div>
                              {withdrawForm.paymentMethod === "PAGO_MOVIL" && (
                                <>
                                  <div>
                                    <label className="block text-xs text-slate-500 mb-1">Banco receptor</label>
                                    <input
                                      type="text"
                                      placeholder="Ej. Banesco"
                                      value={withdrawForm.bankName}
                                      onChange={(e) => setWithdrawForm((p) => ({ ...p, bankName: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-xs text-slate-500 mb-1">Tel�fono</label>
                                    <input
                                      type="tel"
                                      placeholder="04XX-XXXXXXX"
                                      value={withdrawForm.phoneNumber}
                                      onChange={(e) => setWithdrawForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                    />
                                  </div>
                                </>
                              )}
                              {(withdrawForm.paymentMethod === "ZELLE" || withdrawForm.paymentMethod === "TRANSFERENCIA") && (
                                <div className="col-span-2">
                                  <label className="block text-xs text-slate-500 mb-1">
                                    {withdrawForm.paymentMethod === "ZELLE" ? "Email / tel�fono Zelle" : "N�mero de cuenta"}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={withdrawForm.paymentMethod === "ZELLE" ? "email@ejemplo.com" : "0001-0001-XX-XXXXXXXX"}
                                    value={withdrawForm.accountNumber}
                                    onChange={(e) => setWithdrawForm((p) => ({ ...p, accountNumber: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                  />
                                </div>
                              )}
                            </div>

                            {withdrawMsg && (
                              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                                withdrawMsg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                              }`}>
                                {withdrawMsg.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                {withdrawMsg.text}
                              </div>
                            )}

                            <Button
                              type="button"
                              disabled={withdrawLoading || !withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0}
                              onClick={submitWithdrawal}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold"
                            >
                              {withdrawLoading
                                ? <><Loader2 size={16} className="animate-spin mr-2" />Enviando�</>
                                : (
                                  <>
                                    <ArrowDownToLine size={16} className="mr-2" />
                                    {`Solicitar retiro de ${withdrawCurrencyPrefix}${withdrawForm.amount || "0"}`}
                                  </>
                                )}
                            </Button>
                          </div>
                        )}

                        {/* Historial */}
                        {withdrawData.withdrawals?.length > 0 && (
                          <div className="px-6 pb-6">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Historial de retiros</p>
                            <div className="space-y-2">
                              {withdrawData.withdrawals.map((w: any) => {
                                const statusCfg: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
                                  PENDING:    { label: "Pendiente",   icon: <Clock size={14} />,         cls: "bg-yellow-50 text-yellow-700" },
                                  PROCESSING: { label: "En proceso",  icon: <Loader2 size={14} />,        cls: "bg-blue-50 text-blue-700" },
                                  COMPLETED:  { label: "Completado",  icon: <CheckCircle2 size={14} />,  cls: "bg-green-50 text-green-700" },
                                  REJECTED:   { label: "Rechazado",   icon: <XCircle size={14} />,        cls: "bg-red-50 text-red-700" },
                                };
                                const cfg = statusCfg[w.status] ?? statusCfg.PENDING;
                                const withdrawalCurrency = w.currency === "VES" ? "VES" : "USD";
                                const withdrawalPrefix = withdrawalCurrency === "USD" ? "$" : "Bs ";
                                return (
                                  <div key={w.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">
                                        {withdrawalPrefix}{Number(w.amount).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {w.paymentMethod?.replace(/_/g, " ")} ({withdrawalCurrency}) � {new Date(w.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                      </p>
                                      {w.adminNotes && <p className="text-xs text-slate-500 mt-0.5 italic">{w.adminNotes}</p>}
                                    </div>
                                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
                                      {cfg.icon}
                                      {cfg.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-10 text-center text-sm text-slate-500">No se pudo cargar la informaci�n.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                  Todas ({reservationStatusCounts.all})
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
                  Pendientes ({reservationStatusCounts.PENDING})
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
                  Confirmadas ({reservationStatusCounts.CONFIRMED})
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
                  Completadas ({reservationStatusCounts.COMPLETED})
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
                  Canceladas ({reservationStatusCounts.CANCELLED})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-3">ID RESERVA</th>
                    <th className="px-6 py-3">CLIENTE</th>
                    <th className="px-6 py-3">FECHAS</th>
                    <th className="px-6 py-3">DETALLES</th>
                    <th className="px-6 py-3">ESTADO</th>
                    <th className="px-6 py-3">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
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
                          <div className="text-xs text-slate-500">{reservation.amountLabel}</div>
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

            {filteredReservations.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-500 text-sm">No hay reservaciones que coincidan con tu b�squeda</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "listings" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Mis anuncios</h3>
                <p className="text-sm text-slate-500">
                  Aqui veras publicados, pendientes, borradores y rechazados.
                </p>
              </div>
              {createHomeAction ? (
                <form action={createHomeAction}>
                  <button type="submit" className="text-sm text-orange-600 hover:underline">
                    Publicar nuevo
                  </button>
                </form>
              ) : (
                <span className="text-sm text-gray-400">Publicar nuevo</span>
              )}
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
                  publishStatus={item.publishStatus}
                  approvalRejectionReason={item.approvalRejectionReason}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Analiticas</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Resumen financiero y rendimiento de tus reservas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange("weekly")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      analyticsRange === "weekly"
                        ? "bg-orange-500 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsRange("monthly")}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      analyticsRange === "monthly"
                        ? "bg-orange-500 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Mensual
                  </button>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm"
                >
                  <CalendarDays size={16} />
                  {analyticsDateRangeLabel}
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-[#152a6b] via-[#182b73] to-[#11245d] p-5 text-white shadow-lg">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold leading-tight">
                      Informe {analyticsRange === "weekly" ? "Semanal" : "Mensual"}
                    </p>
                    <p className="text-sm text-white/75">{analyticsDateRangeLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Ingresos Brutos</span>
                    <DollarSign size={14} />
                  </div>
                  <p className="mt-2 text-3xl font-bold">${analyticsGrossRevenue.toFixed(0)}</p>
                  <p className="mt-1 text-xs text-emerald-300">Neto: ${analyticsNetRevenue.toFixed(2)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Comision Destinos Venezuela</span>
                    <PieChart size={14} />
                  </div>
                  <p className="mt-2 text-3xl font-bold">-${analyticsCommission.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-white/70">Retenido en plataforma</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Total Reservas</span>
                    <CalendarCheck size={14} />
                  </div>
                  <p className="mt-2 text-3xl font-bold">{analyticsTotalBookings}</p>
                  <p className="mt-1 text-xs text-white/70">Mejor dia: {analyticsBestPeriodLabel}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>Ticket Promedio</span>
                    <Star size={14} />
                  </div>
                  <p className="mt-2 text-3xl font-bold">${analyticsAverageTicket.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-white/70">Rating: {stats.rating ? stats.rating.toFixed(1) : "-"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Ingresos {analyticsRange === "weekly" ? "Semanales" : "Mensuales"}
                  </h4>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    USD
                  </span>
                </div>

                <svg
                  viewBox={`0 0 ${lineChartGeometry.width} ${lineChartGeometry.height}`}
                  className="h-64 w-full"
                  preserveAspectRatio="none"
                >
                  {lineChartGeometry.yTicks.map((tick) => (
                    <g key={`tick-${tick.value}-${tick.y}`}>
                      <line
                        x1={lineChartGeometry.leftPadding}
                        y1={tick.y}
                        x2={lineChartGeometry.width - lineChartGeometry.rightPadding}
                        y2={tick.y}
                        stroke="#e5e7eb"
                        strokeDasharray="4 6"
                      />
                      <text x={8} y={tick.y + 4} fontSize="11" fill="#94a3b8">
                        ${tick.value}
                      </text>
                    </g>
                  ))}

                  <polygon fill="rgba(251,146,60,0.12)" points={lineChartGeometry.areaPath} />
                  <polyline
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={lineChartGeometry.polyline}
                  />

                  {lineChartGeometry.points.map((point, index) => (
                    <g key={`point-${index}`}>
                      <circle cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#f97316" strokeWidth="2" />
                    </g>
                  ))}
                </svg>

                <div
                  className="mt-2 grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${selectedAnalytics.labels.length}, minmax(0, 1fr))`,
                  }}
                >
                  {selectedAnalytics.labels.map((label, index) => (
                    <div key={`line-label-${label}-${index}`} className="text-center">
                      <p className="text-xs font-medium text-slate-500">{label}</p>
                      <p className="text-xs text-slate-400">${selectedAnalytics.revenueUsd[index]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-slate-900">
                    Reservas por {analyticsRange === "weekly" ? "Dia" : "Mes"}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Bookings
                  </span>
                </div>

                <div className="h-64">
                  <div
                    className="grid h-full items-end gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${selectedAnalytics.labels.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {selectedAnalytics.bookings.map((value, index) => {
                      const barHeight = Math.max(
                        10,
                        (value / Math.max(selectedAnalytics.maxBookings, 1)) * 100
                      );
                      const isPeak = index === selectedAnalytics.bestBookingIndex;

                      return (
                        <div key={`bar-${selectedAnalytics.labels[index]}-${index}`} className="flex h-full flex-col justify-end">
                          <div className="group relative flex flex-1 items-end justify-center">
                            <div
                              className={`w-full rounded-t-xl transition ${
                                isPeak ? "bg-[#1a337a]" : "bg-[#294691]"
                              }`}
                              style={{ height: `${barHeight}%` }}
                            />
                            <span className="pointer-events-none absolute -top-8 rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover:opacity-100">
                              {value} reservas
                            </span>
                          </div>
                          <p className="mt-2 text-center text-xs font-medium text-slate-500">
                            {selectedAnalytics.labels[index]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="max-w-2xl">
            {userData && userId ? (
              <ProfileEditClient userData={userData} userId={userId} initialDocs={initialDocs} />
            ) : (
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
                      Estado / Regi�n
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
                    placeholder="Cu�ntales a los hu�spedes un poco sobre ti (m�ximo 500 caracteres)"
                    maxLength={500}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500">
                    Los cambios se guardar�n autom�ticamente
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}



