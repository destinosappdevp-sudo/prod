"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, PiggyBank, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { BANKS } from "@/app/lib/paymentBanks";

type CheckoutMode = "DIRECT" | "MIXED" | "SAVINGS";

const EXTRA_LOADING_MS = 2500;

const delayMs = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export type SavingsFlowConfig = {
  kind: "package" | "general";
  goalUsd?: number;
  alreadySavedUsd?: number;
  remainingUsd?: number;
  packageTitle?: string;
};

interface CheckoutFormProps {
  homeId: string;
  userId: string;
  startDate: string;
  endDate: string;
  guests: number;
  nights: number;
  subtotal: number;
  total: number;
  bcvRate: number;
  totalBs: number;
  savingsTotalUsd: number;
  seatId?: string;
  seatIds?: string[];
  plan?: string;
  savingsFlow?: SavingsFlowConfig;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export default function CheckoutForm({
  homeId,
  userId,
  startDate,
  endDate,
  guests,
  nights,
  subtotal,
  total,
  bcvRate,
  totalBs,
  savingsTotalUsd,
  seatId,
  seatIds,
  plan,
  savingsFlow,
}: CheckoutFormProps) {
  const router = useRouter();
  const isSavingsFlow = Boolean(savingsFlow);
  const isPackageSavings = savingsFlow?.kind === "package";
  const remainingUsd = roundMoney(Math.max(0, savingsFlow?.remainingUsd ?? 0));
  const [loading, setLoading] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [depositAmountUsd, setDepositAmountUsd] = useState<string>("");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    cedula: "",
    emisorBank: "",
    referenceNumber: "",
  });

  const hasValidBcvRate = Number.isFinite(bcvRate) && bcvRate > 0;

  // En flujo de ahorro, el "total" se reemplaza por el monto del abono ingresado
  const parsedDepositUsd = Number(depositAmountUsd);
  const validDeposit = Number.isFinite(parsedDepositUsd) && parsedDepositUsd > 0;
  const effectiveTotalUsd = isSavingsFlow
    ? validDeposit
      ? roundMoney(parsedDepositUsd)
      : 0
    : total;
  const effectiveTotalBs = hasValidBcvRate ? roundMoney(effectiveTotalUsd * bcvRate) : 0;

  const availableSavingsUsd = roundMoney(Math.max(0, savingsTotalUsd || 0));
  const savingsAppliedUsd = roundMoney(Math.min(availableSavingsUsd, effectiveTotalUsd));
  const savingsAppliedBs = hasValidBcvRate ? roundMoney(savingsAppliedUsd * bcvRate) : 0;
  const externalDueUsd = roundMoney(Math.max(0, effectiveTotalUsd - savingsAppliedUsd));
  const externalDueBs = hasValidBcvRate ? roundMoney(Math.max(0, effectiveTotalBs - savingsAppliedBs)) : 0;
  const canPayWithSavingsOnly = !isSavingsFlow && availableSavingsUsd >= effectiveTotalUsd && effectiveTotalUsd > 0;
  const canUseMixed = !isSavingsFlow && savingsAppliedUsd > 0 && externalDueUsd > 0;

  const [selectedMode, setSelectedMode] = useState<CheckoutMode>(
    isSavingsFlow
      ? "DIRECT"
      : canPayWithSavingsOnly
      ? "SAVINGS"
      : canUseMixed
      ? "MIXED"
      : "DIRECT"
  );

  const normalizePhone = (value: string) => {
    const hasLeadingPlus = value.startsWith("+");
    const digitsOnly = value.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`.slice(0, 14);
  };

  const phoneValid = /^\+?\d{7,14}$/.test(formData.phoneNumber);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const requiresPagoMovil = selectedMode !== "SAVINGS";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresPagoMovil && !hasValidBcvRate) {
      alert("No hay tasa BCV válida configurada para procesar este pago.");
      return;
    }

    if (isSavingsFlow) {
      if (!validDeposit) {
        alert("Ingresa un monto válido en USD para abonar.");
        return;
      }
      if (isPackageSavings && remainingUsd > 0 && parsedDepositUsd > remainingUsd + 0.001) {
        alert(`El monto excede lo que falta de la meta ($${remainingUsd.toFixed(2)}).`);
        return;
      }
    }

    if (!isSavingsFlow && selectedMode === "SAVINGS" && !canPayWithSavingsOnly) {
      alert("No tienes saldo suficiente en tu alcancía para cubrir este paquete.");
      return;
    }

    if (!isSavingsFlow && selectedMode === "MIXED" && !canUseMixed) {
      alert("No tienes saldo suficiente en tu alcancía para hacer un pago mixto.");
      return;
    }

    if (requiresPagoMovil && !phoneValid) {
      alert("Ingresa un número de teléfono válido (solo dígitos, puede iniciar con +, entre 7 y 14 caracteres).");
      return;
    }

    if (requiresPagoMovil && !paymentProofFile) {
      alert("Debes adjuntar la captura del pago móvil para continuar.");
      return;
    }

    setLoading(true);
    try {
      let paymentProofUrl: string | null = null;

      if (requiresPagoMovil) {
        setUploadingProof(true);
        paymentProofUrl = await uploadPaymentProof();
        setUploadingProof(false);
      }

      if (isSavingsFlow) {
        const response = await fetch("/api/user/savings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountUsd: effectiveTotalUsd,
            amountBs: effectiveTotalBs,
            paymentDetails: {
              ...formData,
              paymentProofUrl,
              homeId: isPackageSavings ? homeId : null,
              homeTitle: isPackageSavings ? savingsFlow?.packageTitle ?? null : null,
              seatId: seatId || null,
              seatIds: Array.isArray(seatIds) ? seatIds : [],
              guests: guests || 1,
              plan: plan || null,
            },
          }),
        });
        await delayMs(EXTRA_LOADING_MS);
        const data = await response.json();
        if (response.ok) {
          router.push(
            isPackageSavings
              ? `/my-dashboard?tab=mi-alcancia&homeId=${encodeURIComponent(homeId)}`
              : "/my-dashboard?tab=mi-alcancia"
          );
          router.refresh();
        } else {
          alert(data.error || "Error al registrar el abono");
        }
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          userId,
          startDate,
          endDate,
          guests,
          nights,
          subtotal,
          serviceFee: 0,
          totalAmount: subtotal,
          totalAmountBs: totalBs,
          bcvRateUsed: bcvRate,
          paymentMethod: "PAGO_MOVIL",
          checkoutMode: selectedMode,
          paymentDetails: {
            ...formData,
            paymentProofUrl,
          },
          seatId: seatId || null,
          seatIds: Array.isArray(seatIds) ? seatIds : [],
          plan: plan || null,
        }),
      });
      await delayMs(EXTRA_LOADING_MS);
      const data = await response.json();
      if (response.ok) {
        if (data?.reservationId) {
          router.push(`/reservation/${data.reservationId}`);
        } else {
          router.push("/my-dashboard?tab=reservations");
        }
      } else {
        alert(data.error || "Error al procesar el pago");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al procesar la solicitud");
    } finally {
      setUploadingProof(false);
      setLoading(false);
    }
  };

  const optionClass = (mode: CheckoutMode, enabled = true) =>
    `w-full rounded-2xl border p-4 text-left transition ${
      selectedMode === mode ? "border-slate-900 bg-white shadow-sm" : "border-slate-200 bg-white"
    } ${enabled ? "cursor-pointer" : "cursor-not-allowed opacity-70"}`;

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h2 className="mb-6 text-xl font-semibold">
          {isSavingsFlow ? "Registrar Abono" : "Método de Pago"}
        </h2>

        {isSavingsFlow && (
          <div className="mb-6 space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                {isPackageSavings ? "Abono al paquete" : "Abono a alcancía general"}
              </p>
              {isPackageSavings && savingsFlow?.packageTitle && (
                <p className="mt-1 text-sm font-semibold text-emerald-900">{savingsFlow.packageTitle}</p>
              )}
              {isPackageSavings && (savingsFlow?.goalUsd ?? 0) > 0 && (
                <p className="mt-1 text-xs text-emerald-700">
                  Meta: <strong>${(savingsFlow?.goalUsd ?? 0).toFixed(2)}</strong>
                  {" · "}Ahorrado: <strong>${(savingsFlow?.alreadySavedUsd ?? 0).toFixed(2)}</strong>
                  {" · "}Falta: <strong>${remainingUsd.toFixed(2)}</strong>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="depositAmountUsd">
                Monto a abonar (USD){isPackageSavings && remainingUsd > 0
                  ? ` — máximo $${remainingUsd.toFixed(2)}`
                  : ""}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <Input
                  id="depositAmountUsd"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={depositAmountUsd}
                  onChange={(e) => setDepositAmountUsd(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
              {hasValidBcvRate && validDeposit && (
                <p className="mt-1 text-xs text-slate-500">
                  Equivale a <strong>Bs {effectiveTotalBs.toFixed(2)}</strong> a tasa BCV {bcvRate.toFixed(2)}.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mb-6 space-y-4">
          {!isSavingsFlow && (
            <>
              <button
                type="button"
                onClick={() => canPayWithSavingsOnly && setSelectedMode("SAVINGS")}
                className={optionClass("SAVINGS", canPayWithSavingsOnly)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {selectedMode === "SAVINGS" ? (
                      <CheckCircle2 size={22} className="mt-0.5 text-slate-900" />
                    ) : (
                      <Circle size={22} className="mt-0.5 text-slate-300" />
                    )}
                    <div>
                      <p className="text-xl font-semibold text-slate-900">Saldo de Ahorros</p>
                      <p className="text-sm text-slate-600">Disponible para este paquete: ${availableSavingsUsd.toFixed(2)}</p>
                      {!canPayWithSavingsOnly && (
                        <p className="mt-2 text-sm text-red-500">Saldo insuficiente</p>
                      )}
                    </div>
                  </div>
                  {canPayWithSavingsOnly && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      Recomendado
                    </span>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => canUseMixed && setSelectedMode("MIXED")}
                className={optionClass("MIXED", canUseMixed)}
              >
                <div className="flex items-start gap-3">
                  {selectedMode === "MIXED" ? (
                    <CheckCircle2 size={22} className="mt-0.5 text-slate-900" />
                  ) : (
                    <Circle size={22} className="mt-0.5 text-slate-300" />
                  )}
                  <div>
                    <p className="text-xl font-semibold text-slate-900">Pago Mixto</p>
                    <p className="text-sm text-slate-600">
                      Usa tus ${savingsAppliedUsd.toFixed(2)} y paga la diferencia
                    </p>
                    {canUseMixed && hasValidBcvRate && (
                      <p className="mt-2 text-sm text-slate-500">
                        Restante por Pago Móvil: Bs {externalDueBs.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode("DIRECT")}
                className={optionClass("DIRECT")}
              >
                <div className="flex items-start gap-3">
                  {selectedMode === "DIRECT" ? (
                    <CheckCircle2 size={22} className="mt-0.5 text-slate-900" />
                  ) : (
                    <Circle size={22} className="mt-0.5 text-slate-300" />
                  )}
                  <div>
                    <p className="text-xl font-semibold text-slate-900">Pago Directo</p>
                    <p className="text-sm text-slate-600">Pago Móvil</p>
                  </div>
                </div>
              </button>
            </>
          )}

          {selectedMode !== "SAVINGS" && (
            <div className="space-y-4 rounded-2xl bg-gray-50 p-4">
              <div className="rounded-lg bg-blue-50 p-3">
                <h3 className="mb-2 text-sm font-semibold">Información del receptor (Pago Móvil)</h3>
                <div className="space-y-1 text-xs">
                  <p><span className="font-medium">Banco:</span> 0169 R4</p>
                  <p><span className="font-medium">Teléfono:</span> 04120736383</p>
                  <p><span className="font-medium">Cédula:</span> 25570037</p>
                  <p>
                    <span className="font-medium">Monto a pagar:</span>{" "}
                    {hasValidBcvRate
                      ? `Bs ${(selectedMode === "MIXED" ? externalDueBs : effectiveTotalBs).toFixed(2)}`
                      : "No disponible"}
                  </p>
                  <p><span className="font-medium">Tasa BCV:</span> {hasValidBcvRate ? `Bs ${bcvRate.toFixed(6)} por USD` : "No disponible"}</p>
                  {selectedMode === "MIXED" && !isSavingsFlow && (
                    <div className="mt-2 rounded-lg bg-white p-3 text-slate-700">
                      <p className="flex items-center gap-2 font-medium">
                        <PiggyBank size={14} /> Se aplicarán ${savingsAppliedUsd.toFixed(2)} de tu alcancía
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="emisorBank">Tu Banco Emisor</Label>
                <Select
                  value={formData.emisorBank}
                  onValueChange={(value) => handleInputChange("emisorBank", value)}
                  required={requiresPagoMovil}
                >
                  <SelectTrigger id="emisorBank">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BANKS.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.code} - {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="phoneNumber"
                  className={formData.phoneNumber && !phoneValid ? "text-red-600" : undefined}
                >
                  Tu Teléfono
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  maxLength={14}
                  pattern="^\+?\d{7,14}$"
                  title="Solo números y + al inicio, entre 7 y 14 caracteres"
                  placeholder={formData.phoneNumber && !phoneValid ? "Ej: +584141234567 (solo números)" : "+584141234567"}
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", normalizePhone(e.target.value))}
                  required={requiresPagoMovil}
                  className={formData.phoneNumber && !phoneValid ? "border-red-300 placeholder:text-red-500 focus-visible:ring-red-400" : undefined}
                />
              </div>

              <div>
                <Label htmlFor="referenceNumber">Número de referencia</Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  placeholder="123456"
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                  required={requiresPagoMovil}
                />
              </div>

              <div>
                <Label htmlFor="paymentProof">Adjuntar captura</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentProofFile(e.target.files?.[0] ?? null)}
                  required={requiresPagoMovil}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sube la captura de tu comprobante (JPG, PNG o WebP).
                </p>
              </div>
            </div>
          )}

          {selectedMode === "SAVINGS" && (
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Se debitará el total del paquete usando solo tu saldo general y el ahorro asociado a este paquete. La reserva quedará pendiente de confirmación por nuestro equipo.
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="mt-6 w-full"
          disabled={loading || uploadingProof || (requiresPagoMovil && !hasValidBcvRate) || (isSavingsFlow && !validDeposit)}
        >
          {loading || uploadingProof
            ? "Procesando..."
            : isSavingsFlow
            ? validDeposit
              ? `Registrar abono de $${effectiveTotalUsd.toFixed(2)}`
              : "Registrar abono"
            : selectedMode === "SAVINGS"
            ? "Confirmar con ahorros"
            : "Confirmar pago"}
        </Button>

        {!hasValidBcvRate && requiresPagoMovil && (
          <p className="mt-3 text-xs text-red-500">
            No se puede procesar el pago porque falta la tasa BCV del día.
          </p>
        )}
      </Card>
    </form>
  );
}



