"use client";

import { Card } from "@/components/ui/card";
import PaymentActions from "./PaymentActions";
import { getPaymentMethodLabel, parsePaymentFinancials } from "@/app/lib/payment-currency";
import SavingActions from "../users/[userId]/savings/SavingActions";

interface FinanzasClientProps {
  /** Movimientos financieros unificados: pagos y abonos de alcancía. */
  movements: any[];
}

export default function FinanzasClient({ movements }: FinanzasClientProps) {
  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const formatUsd = (amount: number) => `$${amount.toFixed(2)}`;
  const formatBs = (amount: number) => `Bs ${amount.toFixed(2)}`;

  const getRowTotals = (payment: any, reservation: any) => {
    const details =
      payment?.paymentDetails && typeof payment.paymentDetails === "object"
        ? (payment.paymentDetails as Record<string, unknown>)
        : null;

    let usdAmount = toNumber(details?.amountUsd);
    let bsAmount = toNumber(details?.amountBs);
    const bcvRate = toNumber(details?.bcvRateUsed);
    const detailCurrency =
      details?.currency === "VES" || details?.currency === "USD"
        ? (details.currency as "USD" | "VES")
        : null;

    if (usdAmount === null) {
      usdAmount = toNumber(reservation?.totalAmount) ?? null;
    }

    if (usdAmount === null && detailCurrency === "USD") {
      usdAmount = toNumber(payment?.amount);
    }

    if (usdAmount === null) {
      usdAmount = toNumber(payment?.amount);
    }

    if (bsAmount === null) {
      if (detailCurrency === "VES") {
        bsAmount = toNumber(payment?.amount);
      }
      if (bsAmount === null && usdAmount !== null && bcvRate !== null && bcvRate > 0) {
        bsAmount = Number((usdAmount * bcvRate).toFixed(2));
      }
    }

    if (usdAmount === null && payment) {
      const parsed = parsePaymentFinancials({
        amount: payment.amount ?? 0,
        subtotal: payment.subtotal ?? 0,
        serviceFee: payment.serviceFee ?? 0,
        paymentMethod: payment.paymentMethod,
        paymentDetails: payment.paymentDetails,
      });
      if (parsed.amountUsd > 0) usdAmount = parsed.amountUsd;
      if (parsed.amountBs > 0 && bsAmount === null) bsAmount = parsed.amountBs;
    }

    return {
      usdLabel: usdAmount !== null ? formatUsd(usdAmount) : "-",
      bsLabel: bsAmount !== null ? formatBs(bsAmount) : null,
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700" },
      CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
      COMPLETED: { label: "Completado", color: "bg-blue-100 text-blue-700" },
    };
    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getMovementBadge = (type: string) => {
    if (type === "saving") {
      return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Abono</span>;
    }

    return <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">Pago</span>;
  };

  const getPaymentProofUrl = (movement: any) => {
    if (typeof movement?.paymentProofUrl === "string" && movement.paymentProofUrl.trim()) {
      return movement.paymentProofUrl;
    }

    const details =
      movement?.paymentDetails && typeof movement.paymentDetails === "object"
        ? (movement.paymentDetails as Record<string, unknown>)
        : null;

    if (typeof details?.paymentProofUrl === "string" && details.paymentProofUrl.trim()) {
      return details.paymentProofUrl;
    }

    return null;
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Movimientos financieros</h2>
        <p className="text-sm text-gray-500">Pagos y abonos de alcancía registrados en la plataforma</p>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="min-w-[700px] w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paquete
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movements.map((movement: any) => {
              const isSaving = movement.type === "saving";
              const res = isSaving ? null : movement.raw?.Reservation;
              const totals = isSaving
                ? {
                    usdLabel: `$${Number(movement.amountUsd ?? 0).toFixed(2)}`,
                    bsLabel:
                      typeof movement.amountBs === "number" && Number.isFinite(movement.amountBs)
                        ? `Bs ${Number(movement.amountBs).toFixed(2)}`
                        : null,
                  }
                : getRowTotals(movement.raw, res);
              const paymentProofUrl = getPaymentProofUrl(movement);
              const dateSrc = movement.date;
              return (
                <tr key={`${movement.type}-${movement.id}`} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dateSrc
                      ? new Date(dateSrc).toLocaleString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMovementBadge(movement.type)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.user?.firstName || "—"}
                    </div>
                    <div className="text-sm text-gray-500">{movement.user?.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{movement.homeTitle || "—"}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-semibold">{totals.usdLabel}</div>
                    {totals.bsLabel && (
                      <div className="text-xs text-gray-500 mt-0.5">{totals.bsLabel}</div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isSaving
                      ? "Abono de Alcancía"
                      : getPaymentMethodLabel(movement.paymentMethod, movement.paymentDetails)}
                    {!isSaving && movement.referenceNumber && (
                      <div className="text-xs text-gray-500">Ref: {movement.referenceNumber}</div>
                    )}
                    {paymentProofUrl && (
                      <div className="mt-1">
                        <a
                          href={paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Ver captura
                        </a>
                      </div>
                    )}
                    {movement.status === "REJECTED" && movement.rejectionReason && (
                      <div className="mt-1 max-w-xs text-xs text-red-600">
                        Motivo: {movement.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(movement.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {movement.type === "payment" && movement.status === "PENDING" && res?.id ? (
                      <PaymentActions paymentId={movement.id} reservationId={res.id} />
                    ) : movement.type === "saving" && movement.status === "PENDING" ? (
                      <SavingActions savingId={movement.id} currentStatus={movement.status} />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {movements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay movimientos registrados</p>
        </div>
      )}
    </Card>
  );
}



