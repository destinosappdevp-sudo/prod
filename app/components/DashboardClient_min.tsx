"use client";

import { useEffect, useMemo, useState } from "react";
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
  reservationId?: string | null;
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
  isSavingProgress?: boolean;
  savedAmountUsd?: number;
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
  targetTitle?: string | null;
  targetId?: string | null;
  reservationId?: string | null;
  kind?: string | null;
  status?: string | null;
  rejectionReason?: string | null;
  guests?: number;
  plan?: string | null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
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
  savingTarget?: string;
  savingTargetId?: string;
  savingTargetSeatId?: string;
  savingTargetSeatIds?: string[];
  savingTargetGuests?: number;
  savingTargetPlan?: "estandar" | "vip";
  savingPackage?: {
    id: string;
    title: string;
    photo?: string | null;
    price?: number | null;
    priceVip?: number | null;
    country?: string | null;
    municipality?: string | null;
    slug?: string | null;
    categoryName?: string[] | null;
  } | null;
  savingPackages?: Array<{
    id: string;
    title: string;
    photo?: string | null;
    price?: number | null;
    priceVip?: number | null;
    country?: string | null;
    municipality?: string | null;
    slug?: string | null;
    categoryName?: string[] | null;
  }>;
  userData?: any;
  initialDocs?: any[];
}

export default function DashboardClient(props: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(props.initialTab || "reservations");
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(props.savingTargetId ?? null);

  useEffect(() => {
    if (props.initialTab && props.initialTab !== activeTab) {
      setActiveTab(props.initialTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialTab]);
  const [amountUsd, setAmountUsd] = useState("");
  const [emisorBank, setEmisorBank] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Movimientos
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [movimientosLoading, setMovimientosLoading] = useState(false);
  const [movimientosError, setMovimientosError] = useState("");

  const rejectedSavingsFallback = useMemo(
    () =>
      (props.savings ?? [])
        .filter((s) => s.status === "REJECTED")
        .map((s) => ({
          id: `saving_${s.id}`,
          kind: "SAVING",
          createdAt: s.date,
          amount: Number(s.amountUsd ?? 0),
          paymentMethod: "PAGO_MOVIL",
          status: "REJECTED",
          referenceNumber: null,
          rejectionReason: s.rejectionReason ?? null,
          paymentDetails: {
            amountUsd: Number(s.amountUsd ?? 0),
            amountBs: Number(s.amountBs ?? 0),
          },
          Reservation: null,
          isSaving: true,
        })),
    [props.savings]
  );

  useEffect(() => {
    if (activeTab !== "movimientos") return;
    setMovimientosLoading(true);
    setMovimientosError("");
    fetch("/api/user/payments")
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        const byId = new Map<string, any>();

        for (const row of rows) {
          byId.set(String(row?.id ?? ""), row);
        }

        // Refuerzo: asegurar que depósitos rechazados de alcancía aparezcan siempre.
        for (const rejectedRow of rejectedSavingsFallback) {
          if (!byId.has(rejectedRow.id)) {
            byId.set(rejectedRow.id, rejectedRow);
          }
        }

        const merged = Array.from(byId.values()).sort((a, b) => {
          const da = new Date(a?.createdAt ?? 0).getTime();
          const db = new Date(b?.createdAt ?? 0).getTime();
          return db - da;
        });

        setMovimientos(merged);
      })
      .catch(() => setMovimientosError("No se pudieron cargar los movimientos."))
      .finally(() => setMovimientosLoading(false));
  }, [activeTab, rejectedSavingsFallback]);

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

  const uploadPaymentProof = async () => {
    if (!paymentProofFile) {
      throw new Error("Debes adjuntar la captura del pago para continuar.");
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", paymentProofFile);

    const uploadResponse = await fetch("/api/checkout/payment-proof", {
      method: "POST",
      body: uploadFormData,
    });

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok || !uploadData?.url) {
      throw new Error(uploadData?.error || "No se pudo subir la captura del pago");
    }

    return uploadData.url as string;
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);

    if (packageSavingsCompleted) {
      setSaveError("Ya completaste el ahorro de este viaje. Ahora puedes ahorrar en tu alcancía general.");
      return;
    }

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
    if (!paymentProofFile) {
      setSaveError("Adjunta la captura del pago móvil.");
      return;
    }
    setSaving(true);
    try {
      setUploadingProof(true);
      const paymentProofUrl = await uploadPaymentProof();
      setUploadingProof(false);

      const res = await fetch("/api/user/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountBs: previewBs,
          paymentDetails: {
            emisorBank,
            phoneNumber,
            referenceNumber: referenceNumber.trim(),
            paymentProofUrl,
            homeId: selectedSavingId || null,
            homeTitle: selectedSavingId ? packageTargetLabel : null,
            seatId: props.savingTargetSeatId || null,
            seatIds: props.savingTargetSeatIds || [],
            guests: props.savingTargetGuests || 1,
            plan: props.savingTargetPlan || null,
          },
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
        setPaymentProofFile(null);
        router.refresh();
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Error de conexión. Intenta nuevamente.");
    } finally {
      setUploadingProof(false);
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
      case "PAGADO":    return "Pagado";
      case "AHORRANDO": return "Ahorrando";
      default:          return status ?? "—";
    }
  }

  function statusStyle(status?: string | null) {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-700";
      case "PENDING":   return "bg-yellow-100 text-yellow-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      case "COMPLETED": return "bg-blue-100 text-blue-700";
      case "PAGADO":    return "bg-emerald-100 text-emerald-700";
      case "AHORRANDO": return "bg-amber-100 text-amber-700";
      default:          return "bg-gray-100 text-gray-700";
    }
  }

  function formatDate(d?: string | Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }

  const savingsRows = props.savings ?? [];
  const reservationsWithSavings = useMemo(() => {
    const paidReservationIds = new Set(
      savingsRows
        .filter((s) => s.kind === "CHECKOUT_DEBIT" && s.status === "APPROVED" && s.reservationId)
        .map((s) => s.reservationId as string)
    );

    const activeSavingHomeIds = new Set(
      savingsRows
        .filter((s) => s.targetId && Number(s.amountUsd ?? 0) > 0 && (s.status === "PENDING" || s.status === "APPROVED"))
        .map((s) => s.targetId as string)
    );

    const baseReservations: GuestReservationItem[] = (props.guestReservations ?? []).map((r) => ({
      ...r,
      status: paidReservationIds.has(r.id)
        ? "PAGADO"
        : r.status === "PENDING" && r.homeId && activeSavingHomeIds.has(r.homeId)
        ? "AHORRANDO"
        : r.status,
      isSavingProgress: false,
    }));

    const reservedHomeIds = new Set(
      baseReservations
        .map((r) => (typeof r.homeId === "string" && r.homeId ? r.homeId : null))
        .filter(Boolean) as string[]
    );

    const packageById = new Map((props.savingPackages ?? []).map((pkg) => [pkg.id, pkg]));
    const activeSavingsByHomeId = new Map<string, number>();
    const reservationIdByHomeId = new Map<string, string>();

    for (const s of savingsRows) {
      if (!s.targetId) continue;
      if (s.reservationId) {
        reservationIdByHomeId.set(s.targetId, s.reservationId);
      }
      const usd = Number(s.amountUsd ?? 0);
      const isPositiveContribution = usd > 0 && (s.status === "APPROVED" || s.status === "PENDING");
      const isDebit = usd < 0;
      if (!isPositiveContribution && !isDebit) continue;

      const current = activeSavingsByHomeId.get(s.targetId) ?? 0;
      activeSavingsByHomeId.set(s.targetId, roundMoney(current + usd));
    }

    const savingReservations: GuestReservationItem[] = [];
    for (const [homeId, savedUsd] of activeSavingsByHomeId.entries()) {
      if (savedUsd <= 0) continue;
      if (reservedHomeIds.has(homeId)) continue;

      const pkg = packageById.get(homeId);
      const packagePriceUsd = Number(pkg?.price ?? 0);
      const isFullyPaidWithSavings = packagePriceUsd > 0 && savedUsd >= packagePriceUsd;
      const reservationId = reservationIdByHomeId.get(homeId) ?? null;
      savingReservations.push({
        id: `saving-${homeId}`,
        homeId,
        reservationId,
        title: pkg?.title || "Paquete",
        country: pkg?.country || "Venezuela",
        municipality: pkg?.municipality || null,
        price: Number(pkg?.price ?? 0),
        photo: pkg?.photo || "",
        description: isFullyPaidWithSavings ? "Paquete pagado con ahorro" : "Ahorro en progreso",
        status: isFullyPaidWithSavings ? "PAGADO" : "AHORRANDO",
        totalAmount: Number(pkg?.price ?? 0),
        isSavingProgress: true,
        savedAmountUsd: savedUsd,
      });
    }

    return [...savingReservations, ...baseReservations];
  }, [props.guestReservations, props.savingPackages, savingsRows]);

  const contributesToBalance = (item: SavingItem) => {
    const usd = Number(item.amountUsd ?? 0);
    if (usd < 0) return true;
    return item.status === "APPROVED" && usd > 0;
  };
  const generalSavings = savingsRows.filter((item) => !item.targetId);
  const packageSavingsMap = new Map<string, { title: string; totalUsd: number; movementCount: number }>();

  savingsRows.forEach((item) => {
    if (!item.targetId) return;
    const current = packageSavingsMap.get(item.targetId) ?? {
      title: item.targetTitle || "Paquete",
      totalUsd: 0,
      movementCount: 0,
    };
    if (contributesToBalance(item)) {
      current.totalUsd = roundMoney(current.totalUsd + Number(item.amountUsd ?? 0));
    }
    current.movementCount += 1;
    packageSavingsMap.set(item.targetId, current);
  });

  const completedPackageIds = new Set(
    Array.from(packageSavingsMap.entries())
      .filter(([targetId, wallet]) => {
        const pkg = (props.savingPackages ?? []).find((item) => item.id === targetId);
        const goal = Number(pkg?.price ?? 0);
        return goal > 0 && wallet.totalUsd >= goal;
      })
      .map(([targetId]) => targetId)
  );

  const savingsWallets = [
    {
      key: "general",
      title: "Alcancía general",
      totalUsd: roundMoney(
        generalSavings.reduce((sum, item) => {
          if (!contributesToBalance(item)) return sum;
          return sum + Number(item.amountUsd ?? 0);
        }, 0)
      ),
      movementCount: generalSavings.length,
      targetId: null as string | null,
    },
    ...Array.from(packageSavingsMap.entries())
      .filter(([targetId]) => !completedPackageIds.has(targetId))
      .map(([targetId, wallet]) => ({
        key: targetId,
        title: wallet.title,
        totalUsd: wallet.totalUsd,
        movementCount: wallet.movementCount,
        targetId,
      })),
  ];

  const selectedWallet = selectedSavingId
    ? savingsWallets.find((wallet) => wallet.targetId === selectedSavingId) ?? null
    : null;
  const selectedSavingPackage = selectedSavingId
    ? props.savingPackages?.find((pkg) => pkg.id === selectedSavingId) ||
      (props.savingPackage?.id === selectedSavingId ? props.savingPackage : null)
    : null;
  const packageTargetLabel = selectedWallet?.title || selectedSavingPackage?.title || props.savingTarget || "este paquete";
  const isPackageSavingsView = Boolean(selectedWallet?.targetId);
  const displayedSavings = selectedWallet?.targetId
    ? savingsRows.filter((item) => item.targetId === selectedWallet.targetId)
    : savingsRows;
  const displayedSavingsTotal = Math.round(
    displayedSavings.reduce((sum, item) => {
      if (!contributesToBalance(item)) return sum;
      return sum + Number(item.amountUsd ?? 0);
    }, 0) * 100
  ) / 100;
  const packageGoalUsd = (() => {
    if (!isPackageSavingsView) return Number(selectedSavingPackage?.price ?? 0);
    const firstDeposit = displayedSavings.find(
      (item) => Number(item.amountUsd ?? 0) > 0 && (item.guests ?? 0) > 0
    );
    const savingGuestsCount = firstDeposit?.guests ?? 1;
    const savingPlan = displayedSavings.find((item) => item.plan)?.plan ?? null;
    const unitPrice =
      savingPlan === "vip" && Number(selectedSavingPackage?.priceVip ?? 0) > 0
        ? Number(selectedSavingPackage!.priceVip)
        : Number(selectedSavingPackage?.price ?? 0);
    return roundMoney(unitPrice * savingGuestsCount);
  })();
  const packageApprovedDepositedUsd = roundMoney(
    displayedSavings.reduce((sum, item) => {
      if (item.status !== "APPROVED") return sum;
      const usd = Number(item.amountUsd ?? 0);
      if (usd <= 0) return sum;
      return sum + usd;
    }, 0)
  );
  const depositInstallments = displayedSavings.filter(
    (item) => Number(item.amountUsd ?? 0) > 0 && item.status === "APPROVED"
  );
  const remainingUsd = roundMoney(Math.max(0, packageGoalUsd - packageApprovedDepositedUsd));
  const progressPercent = packageGoalUsd > 0
    ? Math.min(100, Math.round((packageApprovedDepositedUsd / packageGoalUsd) * 100))
    : 0;
  const packageSavingsCompleted = isPackageSavingsView && packageGoalUsd > 0 && remainingUsd <= 0;
  const packageDetailHref = selectedSavingPackage?.slug
    ? buildHomeUrl(selectedSavingPackage.slug, selectedSavingPackage.id, selectedSavingPackage.categoryName)
    : null;

    const menuItems = [
    { key: "reservations", label: "Mis Reservas",  icon: CalendarCheck },
    { key: "favorites",    label: "Favoritos",      icon: Heart },
    { key: "movimientos",  label: "Mis Movimientos", icon: Smartphone },
    { key: "mi-alcancia",  label: "Mi Alcancía",    icon: PiggyBank },
    { key: "ahorrar",      label: "Ahorrar",        icon: PlusCircle },
    { key: "profile",      label: "Perfil",         icon: User },
  ];
  const activeMenuLabel = menuItems.find((item) => item.key === activeTab)?.label || "Mi Escritorio";

  function handlePanelTabClick(nextTab: string) {
    setActiveTab(nextTab);
    setMobileMenuOpen(false);

    if (nextTab === "mi-alcancia" || nextTab === "ahorrar") {
      setSelectedSavingId(null);
    }

    router.replace(`/my-dashboard?tab=${nextTab}`);
  }

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
                onClick={() => handlePanelTabClick(item.key)}
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
        <div className="sticky top-[96px] z-20 mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-700">{activeMenuLabel}</span>
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
            {activeTab === "movimientos" && "Mis Movimientos"}
            {activeTab === "mi-alcancia" && (isPackageSavingsView ? `Ahorros de ${packageTargetLabel}` : "Mi Alcancía")}
            {activeTab === "ahorrar" && (isPackageSavingsView ? `Ahorrar para ${packageTargetLabel}` : "Ahorrar")}
            {activeTab === "profile" && "Editar Perfil"}
          </h1>
          <p className="text-sm text-slate-500">
            {activeTab === "reservations" && "Explora, reserva y gestiona tus alojamientos"}
            {activeTab === "favorites" && "Alojamientos que guardaste"}
            {activeTab === "movimientos" && "Consulta todos tus pagos, depósitos y retiros con su estado y detalles."}
            {activeTab === "mi-alcancia" && (isPackageSavingsView ? "Movimientos asociados a este paquete" : "Historial de todas tus alcancías")}
            {activeTab === "ahorrar" && (isPackageSavingsView ? "Deposita saldo para este paquete específico" : "Elige entre tu alcancía general o las alcancías de paquetes")}
            {activeTab === "profile" && "Actualiza tus datos personales"}
          </p>
        </div>
        {/* MIS MOVIMIENTOS */}
        {activeTab === "movimientos" && (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {movimientosLoading ? (
              <div className="p-12 text-center text-slate-400">Cargando movimientos...</div>
            ) : movimientosError ? (
              <div className="p-12 text-center text-red-500">{movimientosError}</div>
            ) : movimientos.length === 0 ? (
              <div className="p-12 text-center">
                <Smartphone className="mx-auto mb-3 text-slate-300" size={48} />
                <p className="text-slate-500">No tienes movimientos registrados aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Alojamiento</th>
                      <th className="px-6 py-3">Método</th>
                      <th className="px-6 py-3">Monto</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Referencia</th>
                      <th className="px-6 py-3">Motivo rechazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov) => {
                      const home = mov.Reservation?.Home;
                      const paymentMethodLabel: Record<string, string> = {
                        PAGO_MOVIL: "Pago Móvil",
                        ZELLE: "Zelle",
                        ZILLI: "Zilli",
                        TARJETA_INTERNACIONAL: "Tarjeta Internacional",
                        TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
                      };
                      const paymentStatusLabel: Record<string, string> = {
                        PENDING: "Pendiente",
                        CONFIRMED: "Confirmado",
                        REJECTED: "Rechazado",
                        CANCELLED: "Cancelado",
                      };
                      const paymentStatusStyle: Record<string, string> = {
                        PENDING: "bg-yellow-100 text-yellow-700",
                        CONFIRMED: "bg-green-100 text-green-700",
                        REJECTED: "bg-red-100 text-red-700",
                        CANCELLED: "bg-gray-100 text-gray-600",
                      };
                      return (
                        <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                            {formatDate(mov.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-slate-800">
                            {home ? (
                              <div>
                                <div className="font-medium">{home.title}</div>
                                <div className="text-xs text-slate-400">{home.country}{home.municipality ? `, ${home.municipality}` : ""}</div>
                              </div>
                            ) : mov.isSaving ? (
                              <div>
                                <div className="font-medium">Depósito a alcancía</div>
                                <div className="text-xs text-slate-400">Recarga de saldo</div>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            {paymentMethodLabel[mov.paymentMethod] ?? mov.paymentMethod ?? "—"}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 font-mono">
                            {(() => {
                              const details = mov.paymentDetails && typeof mov.paymentDetails === "object" ? mov.paymentDetails as Record<string, any> : null;
                              const usd = details?.amountUsd ?? details?.subtotalUsd ?? null;
                              const bs = details?.amountBs ?? details?.subtotalBs ?? null;
                              if (usd != null) return `$${Number(usd).toFixed(2)}`;
                              if (bs != null) return `Bs ${Number(bs).toFixed(2)}`;
                              return `$${Number(mov.amount ?? 0).toFixed(2)}`;
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle[mov.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {paymentStatusLabel[mov.status] ?? mov.status ?? "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                            {mov.referenceNumber ?? "—"}
                          </td>
                          <td className="px-6 py-4 text-red-500 text-xs">
                            {mov.rejectionReason ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MIS RESERVAS */}
        {activeTab === "reservations" && (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            {reservationsWithSavings.length > 0 ? (
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
                    {reservationsWithSavings.map((res) => (
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
                          {res.isSavingProgress
                            ? res.status === "PAGADO"
                              ? "Pagado con ahorro"
                              : "Ahorro activo"
                            : `${formatDate(res.startDate)} ? ${formatDate(res.endDate)}`}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {res.isSavingProgress
                            ? `$${Number(res.savedAmountUsd ?? 0).toFixed(2)} / $${Number(res.totalAmount ?? res.price ?? 0).toFixed(2)}`
                            : res.totalAmount != null
                            ? `$${Number(res.totalAmount).toFixed(2)}`
                            : `$${res.price.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(res.status)}`}>
                            {statusLabel(res.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {res.isSavingProgress && !res.reservationId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSavingId(res.homeId ?? null);
                                setActiveTab("mi-alcancia");
                              }}
                              className="text-orange-600 hover:underline text-xs font-medium"
                            >
                              Ver reserva
                            </button>
                          ) : (
                            <Link href={`/reservation/${res.reservationId ?? res.id}`} className="text-orange-600 hover:underline text-xs font-medium">
                              Ver reserva
                            </Link>
                          )}
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
            {isPackageSavingsView && selectedSavingPackage && (
              <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                  <div className="relative min-h-[180px] bg-slate-100">
                    {selectedSavingPackage.photo ? (
                      <SupabaseImage imagePath={selectedSavingPackage.photo} alt={packageTargetLabel} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Ahorro activo</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-900">{packageTargetLabel}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {selectedSavingPackage.country || "Venezuela"}
                          {selectedSavingPackage.municipality ? `, ${selectedSavingPackage.municipality}` : ""}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                        <p className="text-xs text-emerald-700">Meta del paquete</p>
                        <p className="text-2xl font-bold text-emerald-900">${packageGoalUsd.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Cuotas abonadas</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{depositInstallments.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Ahorrado</p>
                        <p className="mt-1 text-2xl font-bold text-green-600">${packageApprovedDepositedUsd.toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs text-slate-500">Te falta</p>
                        <p className="mt-1 text-2xl font-bold text-orange-600">${remainingUsd.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Progreso del ahorro</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-orange-400" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {!packageSavingsCompleted && (
                        <button
                          type="button"
                          onClick={() => setActiveTab("ahorrar")}
                          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
                        >
                          Agregar cuota
                        </button>
                      )}
                      {packageDetailHref && (
                        <Link
                          href={packageDetailHref}
                          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Ver paquete
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Todas tus alcancías</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savingsWallets.map((wallet) => (
                  <button
                    key={wallet.key}
                    type="button"
                    onClick={() => setSelectedSavingId(wallet.targetId)}
                    className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                      wallet.targetId === selectedSavingId
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {wallet.targetId ? "Paquete específico" : "General"}
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{wallet.title}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">${wallet.totalUsd.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {wallet.movementCount} movimiento{wallet.movementCount !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs text-slate-500 mb-1">Total ahorrado (USD)</p>
                <p className="text-3xl font-bold text-green-600">
                  ${displayedSavingsTotal.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs text-slate-500 mb-1">Movimientos</p>
                <p className="text-3xl font-bold text-slate-800">
                  {displayedSavings.length}
                </p>
              </div>
            </div>

            {/* Savings table */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
              {displayedSavings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 font-semibold border-b border-slate-100 bg-slate-50">
                        <th className="px-6 py-3">#</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Destino</th>
                        <th className="px-6 py-3">Tasa BCV</th>
                        <th className="px-6 py-3">Monto Bs.</th>
                        <th className="px-6 py-3">Monto USD</th>
                        <th className="px-6 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedSavings.map((s, index) => {
                        const savingStatusLabel: Record<string, string> = { PENDING: "En revisi�n", APPROVED: "Aprobado", REJECTED: "Rechazado" };
                        const savingStatusStyle: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700" };
                        const sStatus = s.status ?? (Number(s.amountUsd) < 0 ? "APPROVED" : "PENDING");
                        return (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                            {displayedSavings.length - index}
                          </td>
                          <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                            {formatDate(s.date)}
                          </td>
                          <td className="px-6 py-4 text-slate-700">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {s.targetTitle || "Alcancía general"}
                            </span>
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
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${savingStatusStyle[sStatus] ?? "bg-gray-100 text-gray-600"}`}>
                              {savingStatusLabel[sStatus] ?? sStatus}
                            </span>
                            {sStatus === "REJECTED" && s.rejectionReason && (
                              <p className="mt-1 text-xs text-red-500">{s.rejectionReason}</p>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <PiggyBank className="mx-auto mb-3 text-slate-300" size={48} />
                  <p className="text-slate-500">
                    {isPackageSavingsView
                      ? "Aún no tienes ahorros registrados para este paquete."
                      : "Aún no tienes ahorros registrados."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ahorrar")}
                    className="mt-4 inline-block text-sm text-orange-600 hover:underline"
                  >
                    {isPackageSavingsView ? "Ahorrar para este paquete" : "Comenzar a ahorrar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AHORRAR */}
        {activeTab === "ahorrar" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-base font-semibold text-slate-900">Todas tus alcancías</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {savingsWallets.map((wallet) => (
                  <button
                    key={wallet.key}
                    type="button"
                    onClick={() => setSelectedSavingId(wallet.targetId)}
                    className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                      wallet.targetId === selectedSavingId
                        ? "border-orange-300 bg-orange-50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {wallet.targetId ? "Paquete específico" : "General"}
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{wallet.title}</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-600">${wallet.totalUsd.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {wallet.movementCount} movimiento{wallet.movementCount !== 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {isPackageSavingsView && selectedSavingPackage && (
              <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Detalle del paquete</p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{packageTargetLabel}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {packageSavingsCompleted
                        ? "Meta completada para este viaje. Los próximos depósitos irán a la alcancía general."
                        : depositInstallments.length > 0
                        ? `Llevas ${depositInstallments.length} cuota${depositInstallments.length !== 1 ? "s" : ""} y te faltan $${remainingUsd.toFixed(2)}.`
                        : "Aún no has abonado tu primera cuota."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="text-slate-500">Meta: <span className="font-semibold text-slate-900">${packageGoalUsd.toFixed(2)}</span></p>
                    <p className="text-slate-500">Ahorrado: <span className="font-semibold text-green-600">${packageApprovedDepositedUsd.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <div className="w-full max-w-md">
              {/* Card estilo mobile */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <PiggyBank size={28} />
                    <h2 className="text-xl font-bold">
                      {isPackageSavingsView && depositInstallments.length > 0 ? "Registrar nueva cuota" : "Depositar a Mi Alcancía"}
                    </h2>
                  </div>
                  <p className="text-sm text-white/80">
                      {props.bcvRate && props.bcvRate > 0
                      ? `Tasa BCV del día: ${Number(props.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD`
                      : "Tasa BCV no disponible"}
                  </p>
                </div>

                <div className="px-6 py-6">
                  {isPackageSavingsView && (
                    <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        Ahorro para este paquete
                      </p>
                      <p className="mt-1 text-sm font-semibold text-emerald-900">{packageTargetLabel}</p>
                      <p className="mt-1 text-xs text-emerald-700">
                        {packageSavingsCompleted
                          ? "Meta completada. Esta alcancía ya no acepta más depósitos para este destino."
                          : "Los depósitos que registres aquí quedarán asociados a este destino."}
                      </p>
                    </div>
                  )}

                  {packageSavingsCompleted && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-800">Ahorro completado</p>
                      <p className="mt-1 text-xs text-amber-700">
                        Ya alcanzaste la meta de este viaje. Si haces otro depósito, debe ser en la alcancía general.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleSave} className="space-y-5">
                    {/* Monto USD */}
                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Monto en Dólares (USD)
                        </label>
                        {isPackageSavingsView && (
                          <span className="text-xs font-medium text-slate-500">
                            Restante: <span className="font-semibold text-orange-600">${remainingUsd.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
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
                        <p><span className="font-medium">Banco:</span> 0169 R4</p>
                        <p><span className="font-medium">Teléfono:</span> 04120736383</p>
                        <p><span className="font-medium">Cédula:</span> 25570037</p>
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
                            {bank.code} · {bank.name}
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Adjuntar captura</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setPaymentProofFile(e.target.files?.[0] ?? null);
                          setSaveError("");
                        }}
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-orange-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-700"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Sube la captura del comprobante (JPG, PNG o WebP).
                      </p>
                    </div>

                    {saveError && (
                      <p className="text-sm text-red-600">{saveError}</p>
                    )}

                    {saveSuccess && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-yellow-800 font-semibold">¡Depósito registrado y en revisión!</p>
                        <p className="text-xs text-yellow-700 mt-1">Tu comprobante fue recibido. Nuestro equipo lo verificará y, una vez aprobado, el saldo se abonará a tu alcancía.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("mi-alcancia")}
                          className="text-xs text-yellow-700 hover:underline mt-1"
                        >
                          Ver Mi Alcancía?
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={saving || uploadingProof || !amountUsd || !previewBs || packageSavingsCompleted}
                      className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {packageSavingsCompleted
                        ? "Meta completada"
                        : saving || uploadingProof
                        ? "Procesando..."
                        : "Registrar Depósito"}
                    </button>
                  </form>
                </div>
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



