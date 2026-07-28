"use client";
import React from "react";

export type Seat = {
  id: string;
  zone: "VIP" | "STANDARD" | string;
  row: number;
  column: string;
  status: "AVAILABLE" | "OCCUPIED" | string;
  occupant?: { firstName?: string; lastName?: string; email?: string } | null;
  occupancySource?: "reservation" | "saving" | null;
  isSelected?: boolean;
};

interface SeatMapProps {
  seats: Seat[];
  onSelectSeat?: (seat: Seat) => void;
  selectedSeatId?: string;
  selectionPlan?: "vip" | "estandar";
}

/**
 * Layout completo del bus (mismo que SeatSelector).
 * Fila 8 tiene 5 posiciones: A, B, C (copiloto), D, E.
 */
const BUS_LAYOUT: {
  row: number;
  columns: { label: string; sellable: boolean }[];
}[] = [
  { row: 1, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 2, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 3, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 4, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 5, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 6, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 7, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: true }, { label: "D", sellable: true }] },
  { row: 8, columns: [{ label: "A", sellable: true }, { label: "B", sellable: true }, { label: "C", sellable: false }, { label: "D", sellable: true }, { label: "E", sellable: true }] },
];

const isSeatSelectableByPlan = (seat: Seat, selectionPlan?: "vip" | "estandar") => {
  if (!selectionPlan) return true;
  if (selectionPlan === "vip") return seat.zone === "VIP";
  return seat.zone === "STANDARD";
};

const getSeatColor = (
  seat: Seat,
  selectedSeatId?: string,
  selectionPlan?: "vip" | "estandar"
) => {
  const isSelectableByPlan = isSeatSelectableByPlan(seat, selectionPlan);
  const canSelect = seat.status === "AVAILABLE" && isSelectableByPlan;

  if (seat.isSelected || seat.id === selectedSeatId) {
    return "bg-amber-400 border-amber-500 text-white cursor-pointer scale-105 shadow-md hover:bg-amber-400 hover:border-amber-500 hover:text-white";
  }
  if (seat.status === "OCCUPIED")
    return "bg-muted border-border text-muted-foreground cursor-not-allowed";
  if (seat.zone === "VIP") {
    return canSelect
      ? "bg-gray-900 border-gray-700 text-white cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
      : "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed opacity-50";
  }
  if (seat.zone === "STANDARD") {
    return canSelect
      ? "bg-card border-border text-foreground cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
      : "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50";
  }
  return canSelect
    ? "bg-card border-border text-foreground cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
    : "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50";
};

const getSeatContent = (seat: Seat, selectionPlan?: "vip" | "estandar") => {
  if (seat.status === "OCCUPIED") return "✕";
  if (!isSeatSelectableByPlan(seat, selectionPlan)) return "⛔";
  return `${seat.column}${seat.row}`;
};

const getSeatTitle = (seat: Seat) => {
  if (seat.status === "OCCUPIED" && seat.occupant) {
    const owner =
      `${seat.occupant.firstName || ""} ${seat.occupant.lastName || ""}`.trim() ||
      "Sin nombre";
    const email = seat.occupant.email || "sin email";
    const sourceLabel =
      seat.occupancySource === "reservation"
        ? "Reserva confirmada"
        : seat.occupancySource === "saving"
        ? "Apartado por ahorro"
        : "Ocupado";
    return `${owner} (${email}) - ${sourceLabel}`;
  }
  return undefined;
};

export default function SeatMap({
  seats,
  onSelectSeat,
  selectedSeatId,
  selectionPlan,
}: SeatMapProps) {
  // Index seats by row+column
  const seatIndex = new Map(seats.map((s) => [`${s.row}-${s.column}`, s]));

  const hasVip = seats.some((s) => s.zone === "VIP");
  const hasStd = seats.some((s) => s.zone === "STANDARD");

  const renderSeatButton = (row: number, column: string) => {
    const seat = seatIndex.get(`${row}-${column}`);
    if (!seat) return <span key={column} className="w-10 h-10" />;

    return (
      <button
        type="button"
        key={seat.id}
        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border-2 transition-all duration-150 ${getSeatColor(seat, selectedSeatId, selectionPlan)}`}
        title={
          !isSeatSelectableByPlan(seat, selectionPlan)
            ? selectionPlan === "vip"
              ? "Solo puedes elegir asientos Premium"
              : "Solo puedes elegir asientos Estándar"
            : getSeatTitle(seat)
        }
        onClick={() => {
          if (!isSeatSelectableByPlan(seat, selectionPlan)) return;
          if (seat.status === "OCCUPIED") return;
          if (onSelectSeat) onSelectSeat(seat);
        }}
      >
        {getSeatContent(seat, selectionPlan)}
      </button>
    );
  };

  const renderNonSellableSeat = () => (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-dashed border-gray-300 bg-gray-100 text-gray-400">
      C
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full">
      {/* Leyenda */}
      <div className="flex gap-4 mb-4">
        <Legend color="bg-gray-900" label="Premium" />
        <Legend color="bg-muted/50 border border-border" label="Estándar" />
        <Legend color="bg-yellow-400" label="Tu Selección" />
        <Legend color="bg-muted" label="Ocupado" />
      </div>

      <div className="rounded-2xl bg-card shadow p-6 w-full max-w-xs flex flex-col items-center">
        {/* Chofer + Motor + Copiloto */}
        <div className="flex items-center justify-center gap-6 mb-4 w-full">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center">
              <span className="text-lg text-muted-foreground">👤</span>
            </div>
            <span className="text-[9px] text-muted-foreground tracking-widest mt-1">
              CHOFER
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center">
              <span className="text-lg text-muted-foreground">⚙</span>
            </div>
            <span className="text-[9px] text-muted-foreground tracking-widest mt-1">
              MOTOR
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center">
              <span className="text-lg text-muted-foreground">👤</span>
            </div>
            <span className="text-[9px] text-muted-foreground tracking-widest mt-1">
              COPILOTO
            </span>
          </div>
        </div>

        {/* Zona VIP */}
        {hasVip && (
          <>
            <div className="mb-2">
              <span className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                ✦ ZONA PREMIUM
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 mb-2">
              {BUS_LAYOUT.filter((layoutRow) =>
                seats.some(
                  (s) => s.row === layoutRow.row && s.zone === "VIP"
                )
              ).map((layoutRow) => (
                <div
                  key={layoutRow.row}
                  className="flex items-center justify-center gap-2"
                >
                  {renderSeatButton(layoutRow.row, "A")}
                  {renderSeatButton(layoutRow.row, "B")}
                  <span className="w-5 text-center text-[10px] text-muted-foreground font-medium">
                    {layoutRow.row}
                  </span>
                  {renderSeatButton(layoutRow.row, "C")}
                  {renderSeatButton(layoutRow.row, "D")}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Divisor */}
        {hasVip && hasStd && (
          <div className="w-full text-center text-xs text-muted-foreground my-2 border-t border-dashed pt-2">
            ZONA ESTÁNDAR
          </div>
        )}

        {!hasVip && hasStd && (
          <div className="mb-2">
            <span className="bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-bold">
              ZONA ESTÁNDAR
            </span>
          </div>
        )}

        {/* Zona Estándar */}
        {hasStd && (
          <div className="flex flex-col items-center gap-2">
            {BUS_LAYOUT.filter((layoutRow) =>
              seats.some(
                (s) => s.row === layoutRow.row && s.zone === "STANDARD"
              )
            ).map((layoutRow) => {
              const isRow8 = layoutRow.row === 8;
              return (
                <div
                  key={layoutRow.row}
                  className="flex items-center justify-center gap-2"
                >
                  {isRow8 ? (
                    <>
                      {renderSeatButton(8, "A")}
                      {renderSeatButton(8, "B")}
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] text-muted-foreground font-medium mb-0.5">
                          8
                        </span>
                        {renderNonSellableSeat()}
                      </div>
                      {renderSeatButton(8, "D")}
                      {renderSeatButton(8, "E")}
                    </>
                  ) : (
                    <>
                      {renderSeatButton(layoutRow.row, "A")}
                      {renderSeatButton(layoutRow.row, "B")}
                      <span className="w-5 text-center text-[10px] text-muted-foreground font-medium">
                        {layoutRow.row}
                      </span>
                      {renderSeatButton(layoutRow.row, "C")}
                      {renderSeatButton(layoutRow.row, "D")}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block w-5 h-5 rounded ${color} border border-border`}
      />
      {label}
    </div>
  );
}
