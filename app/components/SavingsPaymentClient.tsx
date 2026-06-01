"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, PiggyBank, Smartphone } from "lucide-react";
import { BANKS } from "@/app/lib/paymentBanks";

type SavingItem = {
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
};

type SavingPackage = {
  id: string;
  title: string;
  photo?: string | null;
  price?: number | null;
  priceVip?: number | null;
  country?: string | null;
  municipality?: string | null;
};

interface SavingsPaymentClientProps {
  bcvRate?: number;
  savings?: SavingItem[];
  savingPackages?: SavingPackage[];
  savingTarget?: string;
  savingTargetId?: string;
  savingTargetSeatId?: string;
  savingTargetSeatIds?: string[];
  savingTargetGuests?: number;
  savingTargetPlan?: "estandar" | "vip";
  savingPackage?: SavingPackage | null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export default function SavingsPaymentClient(props: SavingsPaymentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlHomeId = searchParams.get("homeId");
  const urlTarget = searchParams.get("target");

  const selectedSavingId = urlHomeId || props.savingTargetId || null;
  const isGeneralSavingsView = !selectedSavingId && urlTarget === "general";
  const hasFixedTarget = Boolean(selectedSavingId) || isGeneralSavingsView;
  const [amountUsd, setAmountUsd] = useState("");
  const [emisorBank, setEmisorBank] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const saveInFlightRef = useRef(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const savingsRows = props.savings ?? [];

  const fallbackGuestsFromQuery =
    typeof props.savingTargetGuests === "number" && props.savingTargetGuests > 0
      ? props.savingTargetGuests
      : Array.isArray(props.savingTargetSeatIds) && props.savingTargetSeatIds.length > 0
      ? props.savingTargetSeatIds.length
      : 1;

  const getTargetGuestsCount = (targetId?: string | null) => {
    if (!targetId) return 1;
    const firstWithGuests = savingsRows.find(
      (item) => item.targetId === targetId && Number(item.guests ?? 0) > 0
    );
    if (firstWithGuests) return Number(firstWithGuests.guests ?? 1);
    if (props.savingTargetId === targetId) return fallbackGuestsFromQuery;
    return 1;
  };

  const getTargetPlan = (targetId?: string | null) => {
    if (!targetId) return null;
    const firstWithPlan = savingsRows.find(
      (item) => item.targetId === targetId && typeof item.plan === "string" && item.plan
    );
    if (firstWithPlan && typeof firstWithPlan.plan === "string") return firstWithPlan.plan;
    if (props.savingTargetId === targetId) return props.savingTargetPlan ?? null;
    return null;
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

  const contributesToBalance = (item: SavingItem) => {
    // No contribuyen los abonos rechazados
    if (item.status === "REJECTED") return false;
    const usd = Number(item.amountUsd ?? 0);
    if (usd < 0) return true;
    return item.status === "APPROVED" && usd > 0;
  };

  // Excluir abonos rechazados de los cálculos y conteos
  const generalSavings = savingsRows.filter((item) => !item.targetId && item.status !== "REJECTED");
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
    // Contar solo movimientos no rechazados
    if (item.status !== "REJECTED") {
      current.movementCount += 1;
    }
    packageSavingsMap.set(item.targetId, current);
  });

  const savingsWallets = [
    {
      key: "general",
      title: "Alcancia general",
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
      .filter(([, wallet]) => roundMoney(wallet.totalUsd) > 0)
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

  const packageTargetLabel = isGeneralSavingsView
    ? "Alcancia general"
    : selectedWallet?.title || selectedSavingPackage?.title || props.savingTarget || "este paquete";

  const activePackageTargetId = selectedSavingId;
  const isPackageSavingsView = Boolean(activePackageTargetId);

  const displayedSavings = useMemo(
    () =>
      isPackageSavingsView && activePackageTargetId
        ? savingsRows.filter((item) => item.targetId === activePackageTargetId)
        : savingsRows.filter((item) => !item.targetId),
    [activePackageTargetId, isPackageSavingsView, savingsRows]
  );

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
  const packageSavingsCompleted = isPackageSavingsView && packageGoalUsd > 0 && remainingUsd <= 0;

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
    if (saveInFlightRef.current) return;
    setSaveError("");
    setSaveSuccess(false);

    if (!hasFixedTarget) {
      setSaveError("Esta vista requiere una alcancia fija. Entra desde Mi Alcancia y usa Pagar.");
      return;
    }

    if (packageSavingsCompleted) {
      setSaveError("Ya completaste el ahorro de este viaje. Ahora puedes ahorrar en tu alcancia general.");
      return;
    }

    const usd = Number(amountUsd);
    if (!usd || usd <= 0) {
      setSaveError("Ingresa un monto valido en USD.");
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
      setSaveError("Ingresa un numero de telefono valido.");
      return;
    }
    if (!referenceNumber.trim()) {
      setSaveError("Ingresa el numero de referencia.");
      return;
    }
    if (!paymentProofFile) {
      setSaveError("Adjunta la captura del pago movil.");
      return;
    }

    const effectiveHomeId = isPackageSavingsView ? activePackageTargetId : null;
    if (isPackageSavingsView && !effectiveHomeId) {
      setSaveError("No pudimos identificar la alcancia del paquete. Selecciona el paquete nuevamente antes de guardar.");
      return;
    }

    setSaving(true);
    saveInFlightRef.current = true;
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
        const destination =
          effectiveHomeId
            ? `/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(effectiveHomeId)}`
            : "/my-dashboard?tab=mi-alcancia";
        router.replace(destination);
        router.refresh();
        return;
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Error de conexion. Intenta nuevamente.");
    } finally {
      setUploadingProof(false);
      setSaving(false);
      saveInFlightRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={selectedSavingId ? `/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(selectedSavingId)}` : "/my-dashboard?tab=mi-alcancia"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver a mis alcancias
            </Link>
            <span className="text-xs text-slate-500">Pago de ahorro</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registrar deposito de ahorro</h1>
        </div>

        {!hasFixedTarget && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-800">Falta seleccionar una alcancia</p>
            <p className="mt-1 text-xs text-amber-700">Vuelve a Mi Alcancia, elige una y presiona Pagar para abrir esta vista con destino fijo.</p>
            <Link
              href="/my-dashboard?tab=mi-alcancia"
              className="mt-3 inline-block rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Ir a Mi Alcancia
            </Link>
          </div>
        )}

        {isPackageSavingsView && selectedSavingPackage && (
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Detalle del paquete</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{packageTargetLabel}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {packageSavingsCompleted
                    ? "Meta completada para este viaje. Los proximos depositos deben ir a la alcancia general."
                    : depositInstallments.length > 0
                    ? `Llevas ${depositInstallments.length} cuota${depositInstallments.length !== 1 ? "s" : ""} y te faltan $${remainingUsd.toFixed(2)}.`
                    : "Aun no has abonado tu primera cuota."}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">Meta: <span className="font-semibold text-slate-900">${packageGoalUsd.toFixed(2)}</span></p>
                <p className="text-slate-500">Ahorrado: <span className="font-semibold text-green-600">${packageApprovedDepositedUsd.toFixed(2)}</span></p>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-6 text-white">
              <div className="mb-2 flex items-center gap-3">
                <PiggyBank size={28} />
                <h2 className="text-xl font-bold">
                  {isPackageSavingsView && depositInstallments.length > 0 ? "Registrar nueva cuota" : "Depositar a mi alcancia"}
                </h2>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                Destino fijo: {packageTargetLabel}
              </p>
              <p className="text-sm text-white/80">
                {props.bcvRate && props.bcvRate > 0
                  ? `Tasa BCV del dia: ${Number(props.bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD`
                  : "Tasa BCV no disponible"}
              </p>
            </div>

            <div className="px-6 py-6">
              {isPackageSavingsView && (
                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Ahorro para este paquete</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-900">{packageTargetLabel}</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    {packageSavingsCompleted
                      ? "Meta completada. Esta alcancia ya no acepta mas depositos para este destino."
                      : "Los depositos que registres aqui quedaran asociados a este destino."}
                  </p>
                </div>
              )}

              {packageSavingsCompleted && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-800">Ahorro completado</p>
                  <p className="mt-1 text-xs text-amber-700">Ya alcanzaste la meta de este viaje. Si haces otro deposito, debe ser en la alcancia general.</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-slate-700">Monto en dolares (USD)</label>
                    {isPackageSavingsView && (
                      <span className="text-xs font-medium text-slate-500">
                        Monto maximo a pagar: <span className="font-semibold text-orange-600">${remainingUsd.toFixed(2)}</span>
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

                {previewBs && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3">
                    <p className="mb-0.5 text-xs text-slate-500">Monto a abonar en Bs.</p>
                    <p className="text-2xl font-bold text-orange-600">
                      Bs. {previewBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                )}

                <div className="rounded-xl bg-blue-50 px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Smartphone size={14} className="text-blue-600" />
                    <p className="text-xs font-semibold text-blue-700">Informacion del receptor (Pago movil)</p>
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p><span className="font-medium">Banco:</span> 0169 R4</p>
                    <p><span className="font-medium">Telefono:</span> 04120736383</p>
                    <p><span className="font-medium">Cedula:</span> 25570037</p>
                    {previewBs && (
                      <p className="mt-1 font-semibold text-blue-800">
                        Monto: Bs. {previewBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tu banco emisor</label>
                  <select
                    value={emisorBank}
                    onChange={(e) => {
                      setEmisorBank(e.target.value);
                      setSaveError("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar...</option>
                    {BANKS.map((bank) => (
                      <option key={bank.value} value={bank.value}>
                        {bank.code} · {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${phoneNumber && !phoneValid ? "text-red-600" : "text-slate-700"}`}>
                    Tu telefono
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={14}
                    placeholder="+584141234567"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(normalizePhone(e.target.value));
                      setSaveError("");
                    }}
                    required
                    className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      phoneNumber && !phoneValid ? "border-red-300" : "border-slate-200"
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Numero de referencia</label>
                  <input
                    type="text"
                    placeholder="123456"
                    value={referenceNumber}
                    onChange={(e) => {
                      setReferenceNumber(e.target.value);
                      setSaveError("");
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Adjuntar captura</label>
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
                  <p className="mt-1 text-xs text-slate-500">Sube la captura del comprobante (JPG, PNG o WebP).</p>
                </div>

                {saveError && <p className="text-sm text-red-600">{saveError}</p>}

                {saveSuccess && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-sm font-semibold text-yellow-800">Deposito registrado y en revision.</p>
                    <p className="mt-1 text-xs text-yellow-700">Tu comprobante fue recibido. El equipo lo verificara antes de abonar el saldo.</p>
                    <Link
                      href={selectedSavingId ? `/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(selectedSavingId)}` : "/my-dashboard?tab=mi-alcancia"}
                      className="mt-1 inline-block text-xs text-yellow-700 hover:underline"
                    >
                      Ver mis alcancias
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!hasFixedTarget || saving || uploadingProof || !amountUsd || !previewBs || packageSavingsCompleted}
                  className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {packageSavingsCompleted
                    ? "Meta completada"
                    : saving || uploadingProof
                    ? "Procesando..."
                    : "Registrar deposito"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
