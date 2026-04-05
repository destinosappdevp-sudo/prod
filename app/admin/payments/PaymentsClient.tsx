"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import PaymentActions from "./PaymentActions";
import { Mail } from "lucide-react";

interface PaymentsClientProps {
  reservations: any[];
}

export default function PaymentsClient({ reservations }: PaymentsClientProps) {
  const [activeTab, setActiveTab] = useState<"recientes" | "activas">("recientes");
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

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

  const getReservationTotals = (reservation: any) => {
    const payment = reservation?.Payment;
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

    return {
      usdLabel: usdAmount !== null ? formatUsd(usdAmount) : "-",
      bsLabel: bsAmount !== null ? formatBs(bsAmount) : null,
    };
  };

  const getPaymentMethodLabel = (method: string): string => {
    const methods: Record<string, string> = {
      PAGO_MOVIL: "Pago Móvil",
      ZELLE: "Zelle",
      ZILLI: "Zilli",
      TARJETA_INTERNACIONAL: "Tarjeta Internacional",
      TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
    };
    return methods[method] || method;
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

  // Filtrar reservas activas (confirmadas y con fecha futura)
  const activeReservations = reservations.filter(
    (r) => r.status === "CONFIRMED" && new Date(r.startDate) > new Date()
  );

  const handleResendEmail = async (reservationId: string, userEmail: string) => {
    setSendingEmail(reservationId);
    try {
      const response = await fetch("/api/admin/reservations/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Email reenviado exitosamente a ${userEmail}`);
      } else {
        alert(`Error: ${data.error || "No se pudo enviar el email"}`);
      }
    } catch (error) {
      console.error("Error al reenviar email:", error);
      alert("Error al enviar el email");
    } finally {
      setSendingEmail(null);
    }
  };

  const currentReservations = activeTab === "recientes" ? reservations : activeReservations;

  return (
    <Card className="overflow-hidden">
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("recientes")}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "recientes"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Reservas y Pagos Recientes
          </button>
          <button
            onClick={() => setActiveTab("activas")}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === "activas"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Reservas Activas ({activeReservations.length})
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paquete
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Noches
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método de Pago
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado Pago
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado Reserva
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {activeTab === "recientes" ? "Acciones" : "Reenviar Email"}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentReservations.map((reservation: any) => (
              <tr key={reservation.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {reservation.User?.firstName} {reservation.User?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{reservation.User?.email}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-900">{reservation.Home?.title || "Sin título"}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(reservation.startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(reservation.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-medium">{reservation.nights || "-"}</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center">
                  {(() => {
                    const totals = getReservationTotals(reservation);
                    return (
                      <>
                        <div className="text-sm font-semibold">{totals.usdLabel}</div>
                        {totals.bsLabel && (
                          <div className="text-xs text-gray-500 mt-0.5">{totals.bsLabel}</div>
                        )}
                      </>
                    );
                  })()}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {reservation.Payment
                      ? getPaymentMethodLabel(reservation.Payment.paymentMethod)
                      : "N/A"}
                  </div>
                  {reservation.Payment?.referenceNumber && (
                    <div className="text-xs text-gray-500">
                      Ref: {reservation.Payment.referenceNumber}
                    </div>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center">
                  {reservation.Payment ? getStatusBadge(reservation.Payment.status) : "-"}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(reservation.status)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {activeTab === "recientes" ? (
                    <>
                      {reservation.Payment && reservation.Payment.status === "PENDING" && (
                        <PaymentActions 
                          paymentId={reservation.Payment.id}
                          reservationId={reservation.id}
                        />
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleResendEmail(reservation.id, reservation.User?.email)}
                      disabled={sendingEmail === reservation.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reenviar email de confirmación al huésped"
                    >
                      <Mail size={14} />
                      {sendingEmail === reservation.id ? "Enviando..." : "Reenviar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentReservations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {activeTab === "recientes" 
              ? "No hay reservas registradas" 
              : "No hay reservas activas"}
          </p>
        </div>
      )}
    </Card>
  );
}
