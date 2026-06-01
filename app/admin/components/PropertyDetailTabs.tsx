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
  PackageSeat?: {
    id?: string | null;
    zone?: string | null;
    row?: number | null;
    column?: string | null;
  } | null;
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
  remainingUsd: number;
  targetUsd?: number;
  guestsCount?: number;
  plan?: "vip" | "estandar" | null;
  planInferred?: boolean;
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
  occupancySource?: "reservation" | "saving" | null;
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
  packageInfo: {
    title: string;
    category: string;
    location: string;
    municipality: string;
    departureDateTime?: string | null;
    meetingPoint?: string | null;
    hostName: string;
    price: number;
    priceVip: number | null;
    amenitiesStandard?: string[];
    amenitiesVip?: string[];
  };
};

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

function getSeatLabelFromReservation(reservation: ReservationItem, allSeats: SeatItem[] = []) {
  // Primero, si el pago contiene seatIds (reserva manual multi-asiento o ahorro), mostrarlos todos
  const paymentDetails = (reservation as any).Payment?.paymentDetails;
  if (paymentDetails && typeof paymentDetails === "object") {
    const seatIds = Array.isArray(paymentDetails.seatIds)
      ? paymentDetails.seatIds
      : typeof paymentDetails.seatId === "string" && paymentDetails.seatId
      ? [paymentDetails.seatId]
      : [];

    if (seatIds.length > 0) {
      const labels = seatIds
        .map((id: string) => {
          const s = allSeats.find((ss) => ss.id === id);
          if (s) return getSeatLabelFromSeat(s);
          return id;
        })
        .filter(Boolean);

      if (labels.length === 1) return labels[0];
      if (labels.length > 1) return labels.join(", ");
    }
  }

  // Fallback: usar PackageSeat (reserva clásica de un solo asiento)
  const seat = reservation.PackageSeat;
  if (!seat) return "Sin asiento";

  const zone = seat.zone === "VIP" ? "VIP" : seat.zone === "STANDARD" ? "ESTANDAR" : "";
  const row = typeof seat.row === "number" ? String(seat.row) : "";
  const column = seat.column || "";
  const baseSeat = `${row}${column}`.trim();

  if (zone && baseSeat) return `${zone} ${baseSeat}`;
  return baseSeat || zone || "Sin asiento";
}

function getPlanLabelFromReservation(reservation: ReservationItem, allSeats: SeatItem[] = []) {
  const rawPlan = (reservation as any).plan;
  if (rawPlan) {
    const p = String(rawPlan).toLowerCase();
    return p === "vip" || p === "v" ? "VIP" : "Estándar";
  }

  // Intentar inferir plan desde payment.paymentDetails.seatIds usando la lista de asientos
  const paymentDetails = (reservation as any).Payment?.paymentDetails;
  if (paymentDetails && typeof paymentDetails === "object") {
    const seatIds = Array.isArray(paymentDetails.seatIds)
      ? paymentDetails.seatIds
      : typeof paymentDetails.seatId === "string" && paymentDetails.seatId
      ? [paymentDetails.seatId]
      : [];

    if (seatIds.length > 0) {
      const firstSeat = allSeats.find((s) => s.id === seatIds[0]);
      if (firstSeat) return firstSeat.zone === "VIP" ? "VIP" : "Estándar";
    }
  }

  if (reservation.PackageSeat?.zone) {
    return reservation.PackageSeat.zone.toUpperCase() === "VIP" ? "VIP" : "Estándar";
  }

  return "Sin plan";
}

function getSeatLabelFromSeat(seat: SeatItem) {
  const zone = seat.zone === "VIP" ? "VIP" : seat.zone === "STANDARD" ? "ESTANDAR" : "";
  const baseSeat = `${seat.row}${seat.column}`.trim();
  if (zone && baseSeat) return `${zone} ${baseSeat}`;
  return baseSeat || zone || "Sin asiento";
}

function getPlanLabelFromSeat(seat: SeatItem) {
  return seat.zone === "VIP" ? "VIP" : "Estándar";
}

function formatDepartureDateTime(value?: string | null) {
  if (!value) return "No configurada";

  const date = new Date(value.includes("T") ? value : `${value}T00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PropertyDetailTabs({
  propertyId,
  price,
  priceVip,
  confirmedReservations,
  savings,
  seats,
  packageInfo,
}: PropertyDetailTabsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"reservas" | "ahorrando" | "asientos" | "reservar" | "pdf">("reservas");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [cedulaInput, setCedulaInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<LookupUser | null>(null);
  const [findingUser, setFindingUser] = useState(false);
  const [reservationMode, setReservationMode] = useState<"cash" | "saving">("cash");

  const [plan, setPlan] = useState<"vip" | "estandar">("estandar");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [guests, setGuests] = useState("1");
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);
  const [savingStartedAt, setSavingStartedAt] = useState(todayIso);
  const [savingDepositUsd, setSavingDepositUsd] = useState("");
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
  const parsedSavingDepositUsd = Number(savingDepositUsd);
  const hasValidSavingInput =
    reservationMode !== "saving" ||
    (Number.isFinite(parsedSavingDepositUsd) &&
      parsedSavingDepositUsd > 0 &&
      parsedSavingDepositUsd < totalAmount &&
      Boolean(savingStartedAt));
  const seatSelectionLockedReason = !selectedUser
    ? "Busca y selecciona un usuario por cédula antes de elegir asiento."
    : !hasValidSavingInput
    ? "Completa primero el monto y la fecha de abono para iniciar el ahorro."
    : "";
  const canSelectSeat = !seatSelectionLockedReason;
  const requiresSeatSelection = seats.length > 0;

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
    () => seats.map((seat) => ({ ...seat, isSelected: selectedSeatIds.includes(seat.id) })),
    [seats, selectedSeatIds]
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

    if (requiresSeatSelection && selectedSeatIds.length === 0) {
      alert("Debes seleccionar al menos un asiento para continuar");
      return;
    }

    if (requiresSeatSelection && selectedSeatIds.length !== guestsCount) {
      alert(`Debes seleccionar ${guestsCount} asiento${guestsCount > 1 ? "s" : ""}.`);
      return;
    }

    if (reservationMode === "saving") {
      if (!Number.isFinite(parsedSavingDepositUsd) || parsedSavingDepositUsd <= 0) {
        alert("Debes indicar un monto de abono válido en USD");
        return;
      }

      if (parsedSavingDepositUsd >= totalAmount) {
        alert("El abono inicial debe ser menor al monto total. Si ya está completo, usa Pagar de contado.");
        return;
      }

      if (!savingStartedAt) {
        alert("Debes indicar la fecha de inicio del ahorro");
        return;
      }
    }

    setSubmittingSale(true);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/manual-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cedula: selectedUser.cedula,
          seatId: selectedSeatIds[0],
          seatIds: selectedSeatIds,
          plan,
          guests: guestsCount,
          reservationMode,
          savingDepositUsd: reservationMode === "saving" ? parsedSavingDepositUsd : null,
          savingStartedAt: reservationMode === "saving" ? savingStartedAt : null,
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

      alert(
        reservationMode === "saving"
          ? "Ahorro específico creado y abono acreditado correctamente"
          : "Reserva manual creada correctamente"
      );
      setSelectedSeatIds([]);
      setObservations("");
      setReferenceNumber("");
      setSavingDepositUsd("");
      setSavingStartedAt(todayIso);
      router.refresh();
    } catch (error) {
      console.error("Error creando reserva manual:", error);
      alert(error instanceof Error ? error.message : "No se pudo crear la reserva manual");
    } finally {
      setSubmittingSale(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const [{ default: JsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = (autoTableModule as { default: Function }).default;
      const doc = new JsPDF({ unit: "pt", format: "a4" });

      doc.setFontSize(17);
      doc.text("Reporte de viaje/paquete", 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generado: ${new Date().toLocaleString("es-ES")}`, 40, 58);

      doc.setTextColor(20, 20, 20);
      doc.setFontSize(11);
      const packageLines = [
        `Paquete: ${packageInfo.title}`,
        `Categoria: ${packageInfo.category}`,
        `Ubicacion: ${packageInfo.location} / ${packageInfo.municipality}`,
        `Fecha y hora de salida: ${formatDepartureDateTime(packageInfo.departureDateTime)}`,
        `Punto de encuentro: ${packageInfo.meetingPoint || "No configurado"}`,
        `Anfitrion: ${packageInfo.hostName}`,
        `Precio estandar: $${packageInfo.price.toFixed(2)}`,
        `Precio VIP: ${packageInfo.priceVip && packageInfo.priceVip > 0 ? `$${packageInfo.priceVip.toFixed(2)}` : "No configurado"}`,
      ];

      let currentY = 78;
      packageLines.forEach((line) => {
        doc.text(line, 40, currentY);
        currentY += 14;
      });

      // Amenidades
      const standardAmenities = (packageInfo.amenitiesStandard || []).slice(0, 8).join(", ") || "Ninguna";
      const vipAmenities = (packageInfo.amenitiesVip || []).slice(0, 8).join(", ") || "Ninguna";
      currentY += 6;
      doc.setFontSize(11);
      doc.text(`Amenidades Estándar: ${standardAmenities}`, 40, currentY);
      currentY += 14;
      doc.text(`Amenidades VIP: ${vipAmenities}`, 40, currentY);
      currentY += 10;
      currentY += 10;
      doc.setFontSize(12);
      doc.text("Usuarios Ahorrando", 40, currentY);

      autoTable(doc, {
        startY: currentY + 8,
        head: [["Usuario", "Email", "Plan", "Ahorrado USD", "Saldo Restante USD"]],
        body:
          savings.length > 0
            ? savings.map((saving) => [
                `${saving.User?.firstName || ""} ${saving.User?.lastName || ""}`.trim() || "Sin nombre",
                saving.User?.email || "-",
                `${saving.plan === "vip" ? "VIP" : "Estándar"}${saving.planInferred ? " (inferido)" : ""}`,
                `$${saving.amountUsd.toFixed(2)}`,
                `$${saving.remainingUsd.toFixed(2)}`,
              ])
            : [["Sin registros", "-", "-", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      const lastY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 0;
      const paidTableStartY = lastY + 24;

      const confirmedReservationBySeatId = new Map<string, ReservationItem>();
      for (const reservation of confirmedReservations) {
        const seatId = reservation.PackageSeat?.id;
        if (seatId) confirmedReservationBySeatId.set(seatId, reservation);
      }

      const assignedSeats = seats.filter((seat) => seat.status === "OCCUPIED" && Boolean(seat.occupant));

      doc.setFontSize(12);
      doc.text("Asientos Asignados (pagados o en ahorro)", 40, paidTableStartY);

      autoTable(doc, {
        startY: paidTableStartY + 8,
        head: [["Usuario", "Email", "Asiento", "Estado", "Metodo", "Monto USD", "Plan"]],
        body:
          assignedSeats.length > 0
            ? assignedSeats.map((seat) => {
                const matchedReservation = confirmedReservationBySeatId.get(seat.id);
                const payment = matchedReservation?.Payment;
                const isPaid = seat.occupancySource === "reservation";

                return [
                  `${seat.occupant?.firstName || ""} ${seat.occupant?.lastName || ""}`.trim() || "Sin nombre",
                  seat.occupant?.email || "-",
                  getSeatLabelFromSeat(seat),
                  isPaid ? "Pagado / Confirmado" : "Apartado en ahorro",
                  payment ? getPaymentMethodLabel(payment.paymentMethod, payment.paymentDetails) : "-",
                  payment ? `$${payment.amount.toFixed(2)}` : "-",
                  matchedReservation ? getPlanLabelFromReservation(matchedReservation, seats) : getPlanLabelFromSeat(seat),
                ];
              })
            : [["Sin registros", "-", "-", "-", "-", "-", "-"]],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [22, 163, 74] },
      });

      const safeTitle = packageInfo.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "paquete";
      doc.save(`reporte-${safeTitle}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("No se pudo generar el PDF. Intenta nuevamente.");
    } finally {
      setDownloadingPdf(false);
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
        <button
          className={`rounded-t-lg px-4 py-2 font-semibold ${
            tab === "pdf" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setTab("pdf")}
        >
          Descargar PDF
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
                          Asiento: {getSeatLabelFromReservation(reservation, seats)} · Plan: {getPlanLabelFromReservation(reservation, seats)}
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
                    <p className="text-sm font-semibold text-green-700">Ahorrado: ${saving.amountUsd.toFixed(2)}</p>
                    <p className="text-xs font-medium text-amber-700">Saldo restante: ${saving.remainingUsd.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      Plan: {saving.plan === "vip" ? "VIP" : "Estándar"}
                      {saving.guestsCount && saving.guestsCount > 1 ? ` · ${saving.guestsCount} cupos` : ""}
                      {saving.planInferred ? " · inferido" : ""}
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

          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Tipo de operación</h4>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reservationMode === "saving"}
                  onChange={(e) => {
                    setReservationMode(e.target.checked ? "saving" : "cash");
                    setSelectedSeatIds([]);
                  }}
                />
                Ahorrar
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Estado actual: <span className="font-medium">{reservationMode === "saving" ? "Ahorrar" : "Pagar de contado"}</span>. Por defecto es pagar de contado.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Cupo</label>
              <select
                value={plan}
                onChange={(e) => {
                  setPlan(e.target.value === "vip" ? "vip" : "estandar");
                  setSelectedSeatIds([]);
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
                onChange={(e) => {
                  setGuests(e.target.value);
                  setSelectedSeatIds([]);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700 md:grid-cols-2 md:items-end">
            <div>
              Monto estimado: <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            {reservationMode === "saving" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Monto del abono (USD)</label>
                  <input
                    type="number"
                    min={0.01}
                    max={Math.max(totalAmount - 0.01, 0.01)}
                    step="0.01"
                    value={savingDepositUsd}
                    onChange={(e) => {
                      setSavingDepositUsd(e.target.value);
                      setSelectedSeatIds([]);
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ej: 25.00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Fecha de inicio / abono</label>
                  <input
                    type="date"
                    value={savingStartedAt}
                    max={todayIso}
                    onChange={(e) => {
                      setSavingStartedAt(e.target.value);
                      setSelectedSeatIds([]);
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Selecciona Asiento</h4>
              <p className="text-xs text-gray-500">
                Disponibles para {plan === "vip" ? "Premium" : "Estandar"}: {selectableSeats.length}
              </p>
            </div>
            {!canSelectSeat && (
              <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {seatSelectionLockedReason}
              </p>
            )}
            {seats.length > 0 ? (
              <>
                <div className={!canSelectSeat ? "pointer-events-none opacity-60" : ""}>
                  <SeatMap
                    seats={seatMapForReserve as Seat[]}
                    selectedSeatId={selectedSeatIds[0]}
                    selectionPlan={plan}
                    onSelectSeat={(seat) => {
                      if (!canSelectSeat) {
                        alert(seatSelectionLockedReason);
                        return;
                      }
                      if (seat.status !== "AVAILABLE") return;

                      setSelectedSeatIds((current) => {
                        if (current.includes(seat.id)) {
                          return current.filter((id) => id !== seat.id);
                        }

                        if (current.length >= guestsCount) {
                          return current;
                        }

                        return [...current, seat.id];
                      });
                    }}
                  />
                </div>
                {selectedSeatIds.length > 0 && (
                  <p className="mt-3 text-sm text-green-700">
                    Asientos seleccionados: {selectedSeatIds.length}/{guestsCount}
                  </p>
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
                placeholder="0169 R4"
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

          <button
            type="submit"
            disabled={submittingSale || !selectedUser || (requiresSeatSelection && selectedSeatIds.length !== guestsCount) || !canSelectSeat}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submittingSale
              ? reservationMode === "saving"
                ? "Registrando ahorro..."
                : "Registrando reserva..."
              : reservationMode === "saving"
              ? "Registrar ahorro específico"
              : "Registrar Reserva Manual"}
          </button>
        </form>
      )}

      {tab === "pdf" && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <h4 className="text-base font-semibold text-gray-900">Exportar reporte PDF del paquete</h4>
            <p className="mt-1 text-sm text-gray-600">
              El PDF incluye informacion de la ficha, tabla de usuarios ahorrando y tabla de
              usuarios con pago confirmado y su asiento asignado.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Reservas Confirmadas</p>
              <p className="text-lg font-semibold text-gray-900">{confirmedReservations.length}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Usuarios Ahorrando</p>
              <p className="text-lg font-semibold text-gray-900">{savings.length}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-500">Asientos Registrados</p>
              <p className="text-lg font-semibold text-gray-900">{seats.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>
      )}
    </div>
  );
}



