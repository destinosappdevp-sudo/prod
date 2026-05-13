"use client";
import { useState } from "react";
import { getPaymentMethodLabel } from "@/app/lib/payment-currency";
import SeatMap, { Seat } from "./SeatMap";

type ReservationItem = {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  nights: number;
  User?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  Payment?: {
    paymentMethod?: string | null;
    paymentDetails?: unknown;
    referenceNumber?: string | null;
    amount: number;
  } | null;
};

type SavingItem = {
  id: string;
  amountUsd: number;
  createdAt: string | Date;
  User?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

type SeatItem = {
  id: string;
  zone: string;
  row: number;
  column: string;
  status: string;
};

type PropertyDetailTabsProps = {
  confirmedReservations: ReservationItem[];
  savings: SavingItem[];
  seats: SeatItem[];
};

export default function PropertyDetailTabs({
  confirmedReservations,
  savings,
  seats,
}: PropertyDetailTabsProps) {
  const [tab, setTab] = useState<"reservas" | "ahorrando" | "asientos">("reservas");

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${tab === "reservas" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setTab("reservas")}
        >
          Reservas Confirmadas
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${tab === "ahorrando" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setTab("ahorrando")}
        >
          Usuarios Ahorrando
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${tab === "asientos" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setTab("asientos")}
        >
          Asientos
        </button>
      </div>
      {tab === "reservas" && (
        <div>
          {confirmedReservations.length > 0 ? (
            <div className="space-y-3">
              {confirmedReservations.map((reservation) => {
                const payment = reservation.Payment;
                return (
                  <div key={reservation.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {reservation.User?.firstName} {reservation.User?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{reservation.User?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(reservation.startDate).toLocaleDateString("es-ES")} - {new Date(reservation.endDate).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.nights} {reservation.nights === 1 ? "noche" : "noches"}
                        </p>
                      </div>
                    </div>
                    {payment && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Método: <span className="font-medium text-gray-900">{getPaymentMethodLabel(payment.paymentMethod, payment.paymentDetails)}</span>
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-gray-500">Ref: {payment.referenceNumber}</p>
                          )}
                          <p className="text-sm font-semibold text-gray-900">${payment.amount.toFixed(2)}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Pago Confirmado</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay reservas confirmadas aún</p>
          )}
        </div>
      )}
      {tab === "ahorrando" && (
        <div>
          {savings.length > 0 ? (
            <div className="space-y-3">
              {savings.map((saving) => (
                <div key={saving.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{saving.User?.firstName} {saving.User?.lastName}</p>
                    <p className="text-sm text-gray-600">{saving.User?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">${saving.amountUsd.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{new Date(saving.createdAt).toLocaleDateString("es-ES")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay usuarios ahorrando aún</p>
          )}
        </div>
      )}
      {tab === "asientos" && (
        <div>
          {seats.length > 0 ? (
            <SeatMap seats={seats as Seat[]} />
          ) : (
            <p className="text-gray-500 text-center py-8">No hay asientos registrados</p>
          )}
        </div>
      )}
    </div>
  );
}
