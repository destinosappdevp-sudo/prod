"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { buildHomeUrl } from "@/app/lib/slug";
import {
  CalendarCheck,
  User,
  LogOut,
  Heart,
  PiggyBank,
  Smartphone,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/app/action";
import ProfileEditClient from "@/app/components/ProfileEditClient";
import { SupabaseImage } from "@/app/components/SupabaseImage";

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
  seatId?: string | null;
  seatIds?: string[];
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() =>
    props.initialTab === "ahorrar" ? "mi-alcancia" : props.initialTab || "reservations"
  );
  const [selectedSavingId, setSelectedSavingId] = useState<string | null>(props.savingTargetId ?? null);
  const urlHomeId = searchParams.get("homeId");

  useEffect(() => {
    const nextTab = props.initialTab === "ahorrar" ? "mi-alcancia" : props.initialTab;
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialTab]);

  useEffect(() => {
    if (urlHomeId && urlHomeId !== selectedSavingId) {
      setSelectedSavingId(urlHomeId);
    }
  }, [urlHomeId, selectedSavingId]);

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
    const effectiveHomeId = selectedSavingId || activePackageTargetId || urlHomeId || props.savingTargetId || null;
    if (isPackageSavingsView && !effectiveHomeId) {
      setSaveError("No pudimos identificar la alcancía del paquete. Selecciona el paquete nuevamente antes de guardar.");
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
          amountUsd: usd,
          amountBs: previewBs,
          paymentDetails: {
            emisorBank,
            phoneNumber,
            referenceNumber: referenceNumber.trim(),
            paymentProofUrl,
            homeId: effectiveHomeId,
            homeTitle: effectiveHomeId ? packageTargetLabel : null,
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
  const fallbackGuestsFromQuery =
    (typeof props.savingTargetGuests === "number" && props.savingTargetGuests > 0
      ? props.savingTargetGuests
      : Array.isArray(props.savingTargetSeatIds) && props.savingTargetSeatIds.length > 0
      ? props.savingTargetSeatIds.length
      : 1);

  const getTargetGuestsCount = (targetId?: string | null) => {
    if (!targetId) return 1;
    const firstWithGuests = savingsRows.find(
      (item) => item.targetId === targetId && Number(item.guests ?? 0) > 0
    );
    if (firstWithGuests) {
      return Number(firstWithGuests.guests ?? 1);
    }
    if (props.savingTargetId === targetId) {
      return fallbackGuestsFromQuery;
    }
    return 1;
  };

  const getTargetPlan = (targetId?: string | null) => {
    if (!targetId) return null;
    const firstWithPlan = savingsRows.find(
      (item) => item.targetId === targetId && typeof item.plan === "string" && item.plan
    );
    if (firstWithPlan && typeof firstWithPlan.plan === "string") {
      return firstWithPlan.plan;
    }
    if (props.savingTargetId === targetId) {
      return props.savingTargetPlan ?? null;
    }
    return null;
  };

  const getTargetSeatIds = (targetId?: string | null): string[] => {
    if (!targetId) return [];
    const firstWithSeats = savingsRows.find(
      (item) => item.targetId === targetId && Array.isArray(item.seatIds) && (item.seatIds?.length ?? 0) > 0
    );
    if (firstWithSeats && Array.isArray(firstWithSeats.seatIds)) return firstWithSeats.seatIds;
    if (props.savingTargetId === targetId && props.savingTargetSeatIds && props.savingTargetSeatIds.length > 0) {
      return props.savingTargetSeatIds;
    }
    return [];
  };

  const buildSavingsCheckoutUrl = (targetId: string | null): string => {
    if (!targetId) return "/checkout/general?flow=ahorro&target=general";
    const savPlan = getTargetPlan(targetId) ?? "estandar";
    const savGuests = getTargetGuestsCount(targetId);
    const savSeatIds = getTargetSeatIds(targetId);
    const urlParams = new URLSearchParams({ flow: "ahorro", plan: savPlan, guests: String(savGuests) });
    if (savSeatIds.length > 0) {
      urlParams.set("seatId", savSeatIds[0]);
      urlParams.set("seatIds", savSeatIds.join(","));
    }
    return `/checkout/${targetId}?${urlParams.toString()}`;
  };

  const getTargetGoalUsd = (
    targetId: string | null | undefined,
    pkg?: { price?: number | null; priceVip?: number | null } | null
  ) => {
    const guestsCount = getTargetGuestsCount(targetId);
    const savingPlan = getTargetPlan(targetId);
    const unitPrice =
      savingPlan === "vip" && Number(pkg?.priceVip ?? 0) > 0
        ? Number(pkg?.priceVip)
        : Number(pkg?.price ?? 0);
    return roundMoney(unitPrice * guestsCount);
  };

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
      const packagePriceUsd = getTargetGoalUsd(homeId, pkg);
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
        totalAmount: packagePriceUsd,
        isSavingProgress: true,
        savedAmountUsd: savedUsd,
      });
    }

    return [...savingReservations, ...baseReservations];
  }, [
    fallbackGuestsFromQuery,
    props.guestReservations,
    props.savingPackages,
    props.savingTargetId,
    props.savingTargetPlan,
    savingsRows,
  ]);

  const contributesToBalance = (item: SavingItem) => {
    const usd = Number(item.amountUsd ?? 0);
    if (usd < 0) return true;
    return item.status === "APPROVED" && usd > 0;
  };
  const generalSavings = savingsRows.filter((item) => !item.targetId);
  const packageSavingsMap = new Map<string, { title: string; totalUsd: number; movementCount: number }>();

  // Paquetes con al menos un abono activo (PENDING o APPROVED con monto > 0)
  const activePackageIds = new Set(
    savingsRows
      .filter(
        (item) =>
          item.targetId &&
          (item.status === "PENDING" || item.status === "APPROVED") &&
          Number(item.amountUsd ?? 0) > 0
      )
      .map((item) => item.targetId as string)
  );

  savingsRows.forEach((item) => {
    if (!item.targetId) return;
    // Solo construir el mapa para paquetes que tienen abonos activos
    if (!activePackageIds.has(item.targetId)) return;
    const current = packageSavingsMap.get(item.targetId) ?? {
      title: item.targetTitle || "Paquete",
      totalUsd: 0,
      movementCount: 0,
    };
    if (contributesToBalance(item)) {
      current.totalUsd = roundMoney(current.totalUsd + Number(item.amountUsd ?? 0));
    }
    // Solo contar movimientos no rechazados para el conteo visible
    if (item.status !== "REJECTED") {
      current.movementCount += 1;
    }
    packageSavingsMap.set(item.targetId, current);
  });

  const completedPackageIds = new Set(
    Array.from(packageSavingsMap.entries())
      .filter(([targetId, wallet]) => {
        const pkg = (props.savingPackages ?? []).find((item) => item.id === targetId);
        const goal = getTargetGoalUsd(targetId, pkg);
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
      movementCount: generalSavings.filter((item) => item.status !== "REJECTED").length,
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
  const activePackageTargetId = selectedWallet?.targetId ?? selectedSavingPackage?.id ?? null;
  const isPackageSavingsView = Boolean(activePackageTargetId);
  const displayedSavings = selectedWallet?.targetId
    ? savingsRows.filter((item) => item.targetId === selectedWallet.targetId)
    : activePackageTargetId
    ? savingsRows.filter((item) => item.targetId === activePackageTargetId)
    : savingsRows;
  const displayedSavingsTotal = Math.round(
    displayedSavings.reduce((sum, item) => {
      if (!contributesToBalance(item)) return sum;
      return sum + Number(item.amountUsd ?? 0);
    }, 0) * 100
  ) / 100;
  const packageGoalUsd = (() => {
    if (!isPackageSavingsView) return Number(selectedSavingPackage?.price ?? 0);
    return getTargetGoalUsd(activePackageTargetId, selectedSavingPackage);
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
    { key: "profile",      label: "Perfil",         icon: User },
  ];
  const activeMenuLabel = menuItems.find((item) => item.key === activeTab)?.label || "Mi Escritorio";

  function handlePanelTabClick(nextTab: string) {
    setActiveTab(nextTab);
    setMobileMenuOpen(false);

    if (nextTab !== "mi-alcancia") {
      setSelectedSavingId(null);
      router.replace(`/my-dashboard?tab=${nextTab}`);
      return;
    }

    const effectiveHomeId = selectedSavingId || urlHomeId || props.savingTargetId || null;
    router.replace(
      effectiveHomeId
        ? `/my-dashboard?tab=${nextTab}&homeId=${encodeURIComponent(effectiveHomeId)}`
        : `/my-dashboard?tab=${nextTab}`
    );
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
            {activeTab === "profile" && "Editar Perfil"}
          </h1>
          <p className="text-sm text-slate-500">
            {activeTab === "reservations" && "Explora, reserva y gestiona tus alojamientos"}
            {activeTab === "favorites" && "Alojamientos que guardaste"}
            {activeTab === "movimientos" && "Consulta todos tus pagos, depósitos y retiros con su estado y detalles."}
            {activeTab === "mi-alcancia" && (isPackageSavingsView ? "Movimientos asociados a este paquete" : "Historial de todas tus alcancías")}
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
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[700px] w-full text-sm">
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
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="min-w-[700px] w-full text-sm">
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
                                if (res.homeId) {
                                  router.replace(`/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(res.homeId)}`);
                                }
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
                          onClick={() => {
                            if (activePackageTargetId) {
                              setSelectedSavingId(activePackageTargetId);
                              router.push(buildSavingsCheckoutUrl(activePackageTargetId));
                            } else {
                              router.push(buildSavingsCheckoutUrl(null));
                            }
                          }}
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
                  <div
                    key={wallet.key}
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSavingId(wallet.targetId);
                          router.replace(
                            wallet.targetId
                              ? `/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(wallet.targetId)}`
                              : "/my-dashboard?tab=mi-alcancia"
                          );
                        }}
                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver movimientos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            wallet.targetId
                              ? buildSavingsCheckoutUrl(wallet.targetId)
                              : buildSavingsCheckoutUrl(null)
                          );
                        }}
                        className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                      >
                        Ahorrar para esta alcancía
                      </button>
                    </div>
                  </div>
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
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="min-w-[700px] w-full text-sm">
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
                    onClick={() => {
                      if (isPackageSavingsView && activePackageTargetId) {
                        setSelectedSavingId(activePackageTargetId);
                        router.push(buildSavingsCheckoutUrl(activePackageTargetId));
                      } else {
                        setSelectedSavingId(null);
                        router.push(buildSavingsCheckoutUrl(null));
                      }
                    }}
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
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-slate-500">El registro de pagos de ahorro ahora esta en una vista separada.</p>
            <Link
              href={buildSavingsCheckoutUrl(selectedSavingId ?? null)}
              className="mt-4 inline-block rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Ir a pagar ahorro
            </Link>
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



