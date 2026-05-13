"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  occupant?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
};

type LookupUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cedula: string;
};

type PropertyDetailTabsProps = {
  propertyId: string;
  price: number;
  priceVip: number | null;
  confirmedReservations: ReservationItem[];
  savings: SavingItem[];
  seats: SeatItem[];
};

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

export default function PropertyDetailTabs({
  propertyId,
  price,
  priceVip,
  confirmedReservations,
  savings,
  seats,
}: PropertyDetailTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"reservas" | "ahorrando" | "asientos" | "reservar">("reservas");

  const [cedulaInput, setCedulaInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<LookupUser | null>(null);
  const [findingUser, setFindingUser] = useState(false);

  const [plan, setPlan] = useState<"vip" | "estandar">("estandar");
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const [guests, setGuests] = useState("1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emisorBank, setEmisorBank] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [payerCedula, setPayerCedula] = useState("");
  const [observations, setObservations] = useState("");
  const [submittingSale, setSubmittingSale] = useState(false);

  const selectedPlanPrice = plan === "vip" && priceVip && priceVip > 0 ? priceVip : price;
  const parsedGuests = Number.parseInt(guests, 10);
  const guestsCount = Number.isInteger(parsedGuests) && parsedGuests > 0 ? parsedGuests : 1;
  const totalAmount = selectedPlanPrice * guestsCount;

  const selectableSeats = useMemo(
    () =>
      seats.filter(
        (seat) =>
          seat.status === "AVAILABLE" &&
          (plan === "vip" ? seat.zone === "VIP" : seat.zone === "STANDARD")
      ),
    [seats, plan]
  );

  const seatMapForReserve = useMemo(
    () => seats.map((seat) => ({ ...seat, isSelected: seat.id === selectedSeatId })),
    [seats, selectedSeatId]
  );

  const handleFindUser = async () => {
    const cedula = normalizeCedulaValue(cedulaInput);
    if (!cedula) {
      alert("Debes ingresar una cédula");
      return;
    }

    setFindingUser(true);
    try {
      const response = await fetch(`/api/admin/users/by-cedula?cedula=${encodeURIComponent(cedula)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo buscar el usuario");
      }

      setSelectedUser(data as LookupUser);
    } catch (error) {
      console.error("Error buscando usuario:", error);
      setSelectedUser(null);
      alert(error instanceof Error ? error.message : "No se pudo buscar el usuario");
    } finally {
      setFindingUser(false);
    }
  };

  const handleManualReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser?.cedula) {
      alert("Primero debes buscar y seleccionar un usuario por cédula");
      return;
    }

    if (!selectedSeatId) {
      alert("Debes seleccionar un asiento para continuar");
      return;
    }

    if (!phoneNumber.trim() || !emisorBank.trim() || !referenceNumber.trim() || !payerCedula.trim()) {
      alert("Completa todos los datos de pago móvil");
      return;
    }

    setSubmittingSale(true);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/manual-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: selectedUser.cedula,
          seatId: selectedSeatId,
          plan,
          guests: guestsCount,
          phoneNumber,
          emisorBank,
          referenceNumber,
          payerCedula: normalizeCedulaValue(payerCedula),
          observations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la reserva manual");
      }

      alert("Reserva manual creada correctamente");
      setSelectedSeatId("");
      setObservations("");
      setReferenceNumber("");
      router.refresh();
    } catch (error) {
      console.error("Error creando reserva manual:", error);
      alert(error instanceof Error ? error.message : "No se pudo crear la reserva manual");
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={`rounded-t-lg px-4 py-2 font-semibold ${
            tab === "reservas" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("reservas")}
        >
          Reservas Confirmadas
        </button>
        <button
          className={`rounded-t-lg px-4 py-2 font-semibold ${
            tab === "ahorrando" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("ahorrando")}
        >
          Usuarios Ahorrando
        </button>
        <button
          className={`rounded-t-lg px-4 py-2 font-semibold ${
            tab === "asientos" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("asientos")}
        >
          Asientos
        </button>
        <button
          className={`rounded-t-lg px-4 py-2 font-semibold ${
            tab === "reservar" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("reservar")}
        >
          Reservar
        </button>
      </div>

      {tab === "reservas" && (
        <div>
          {confirmedReservations.length > 0 ? (
            <div className="space-y-3">
              {confirmedReservations.map((reservation) => {
                const payment = reservation.Payment;
                return (
                  <div key={reservation.id} className="space-y-3 rounded-lg bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {reservation.User?.firstName} {reservation.User?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{reservation.User?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(reservation.startDate).toLocaleDateString("es-ES")} -{" "}
                          {new Date(reservation.endDate).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.nights} {reservation.nights === 1 ? "noche" : "noches"}
                        </p>
                      </div>
                    </div>
                    {payment && (
                      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Método:{" "}
                            <span className="font-medium text-gray-900">
                              {getPaymentMethodLabel(payment.paymentMethod, payment.paymentDetails)}
                            </span>
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-gray-500">Ref: {payment.referenceNumber}</p>
                          )}
                          <p className="text-sm font-semibold text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Pago Confirmado
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">No hay reservas confirmadas aun</p>
          )}
        </div>
      )}

      {tab === "ahorrando" && (
        <div>
          {savings.length > 0 ? (
            <div className="space-y-3">
              {savings.map((saving) => (
                <div
                  key={saving.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-medium">
                      {saving.User?.firstName} {saving.User?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{saving.User?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-700">
                      ${saving.amountUsd.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(saving.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-gray-500">No hay usuarios ahorrando aun</p>
          )}
        </div>
      )}

      {tab === "asientos" && (
        <div>
          {seats.length > 0 ? (
            <SeatMap seats={seats as Seat[]} />
          ) : (
            <p className="py-8 text-center text-gray-500">No hay asientos registrados</p>
          )}
        </div>
      )}

      {tab === "reservar" && (
        <form onSubmit={handleManualReservation} className="space-y-5">
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Buscar Usuario Por Cedula</h4>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={cedulaInput}
                onChange={(e) => setCedulaInput(e.target.value)}
                placeholder="Ej: V-12345678"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleFindUser}
                disabled={findingUser}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                {findingUser ? "Buscando..." : "Buscar"}
              </button>
            </div>
            {selectedUser && (
              <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm">
                <p className="font-semibold text-blue-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-blue-800">{selectedUser.email}</p>
                <p className="text-blue-800">Cedula: {selectedUser.cedula}</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Cupo</label>
              <select
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value === "vip" ? "vip" : "estandar");
                  setSelectedSeatId("");
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="estandar">Estandar</option>
                <option value="vip">Premium VIP</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cupos</label>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Selecciona Asiento</h4>
              <p className="text-xs text-gray-500">
                Disponibles para {plan === "vip" ? "Premium" : "Estandar"}: {selectableSeats.length}
              </p>
            </div>
            {seats.length > 0 ? (
              <>
                <SeatMap
                  seats={seatMapForReserve as Seat[]}
                  selectedSeatId={selectedSeatId}
                  onSelectSeat={(seat) => {
                    if (seat.status !== "AVAILABLE") return;
                    if (plan === "vip" && seat.zone !== "VIP") {
                      alert("Selecciona un asiento de zona Premium");
                      return;
                    }
                    if (plan === "estandar" && seat.zone !== "STANDARD") {
                      alert("Selecciona un asiento de zona Estandar");
                      return;
                    }
                    setSelectedSeatId(seat.id);
                  }}
                />
                {selectedSeatId && (
                  <p className="mt-3 text-sm text-green-700">Asiento seleccionado correctamente.</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Este paquete no tiene asientos configurados.</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Telefono Pago Movil</label>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="04141234567"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Banco Emisor</label>
              <input
                value={emisorBank}
                onChange={(e) => setEmisorBank(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Banco de Venezuela"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Referencia</label>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cedula Pagador</label>
              <input
                value={payerCedula}
                onChange={(e) => setPayerCedula(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="V-12345678"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Observaciones</label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-[90px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Notas internas de la venta manual"
            />
          </div>

          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Monto estimado: <span className="font-semibold">${totalAmount.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={submittingSale || !selectedUser || !selectedSeatId}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submittingSale ? "Registrando reserva..." : "Registrar Reserva Manual"}
          </button>
        </form>
      )}
    </div>
  );
}
