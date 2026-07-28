"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SeatData = {
  id: string;
  zone: "VIP" | "STANDARD";
  row: number;
  column: string;
  status: "AVAILABLE" | "OCCUPIED";
};

interface SeatSelectorProps {
  seats: SeatData[];
  plan: "vip" | "estandar";
  homeId: string;
  flow: "ahorro" | "contado";
  guests: number;
}

/**
 * Layout completo del bus (33 posiciones físicas, 31 vendibles).
 * Chofer y copiloto NO se venden.
 */
const BUS_LAYOUT: {
  row: number;
  columns: { label: string; sellable: boolean }[];
}[] = [
  // Chofer y copiloto se renderizan como elementos estáticos en el JSX
  {
    row: 1,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 2,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 3,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 4,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 5,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 6,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 7,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: true },
      { label: "D", sellable: true },
    ],
  },
  {
    row: 8,
    columns: [
      { label: "A", sellable: true },
      { label: "B", sellable: true },
      { label: "C", sellable: false }, // Copiloto
      { label: "D", sellable: true },
      { label: "E", sellable: true },
    ],
  },
];

export default function SeatSelector({
  seats,
  plan,
  homeId,
  flow,
  guests,
}: SeatSelectorProps) {
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const selectedSeatIdSet = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds]
  );

  // Index by row+column for fast lookup
  const seatMap = useMemo(
    () => new Map(seats.map((s) => [`${s.row}-${s.column}`, s])),
    [seats]
  );

  const isSelectable = (seat: SeatData) => {
    if (seat.status === "OCCUPIED") return false;
    if (plan === "vip" && seat.zone !== "VIP") return false;
    if (plan === "estandar" && seat.zone !== "STANDARD") return false;
    return true;
  };

  const isSelectableByPlan = (seat: SeatData) => {
    if (plan === "vip") return seat.zone === "VIP";
    return seat.zone === "STANDARD";
  };

  const handleSeatClick = (seat: SeatData) => {
    if (!isSelectable(seat)) return;
    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter((id) => id !== seat.id);
      }
      if (current.length >= guests) {
        return current;
      }
      return [...current, seat.id];
    });
  };

  const handleContinue = () => {
    const savingsUrl = (seatIds: string[]) => {
      const params = new URLSearchParams({
        flow: "ahorro",
        plan,
        guests: String(guests),
      });
      if (seatIds.length > 0) {
        params.set("seatId", seatIds[0]);
        params.set("seatIds", seatIds.join(","));
      }
      return `/checkout/${homeId}?${params.toString()}`;
    };

    if (seats.length === 0) {
      if (flow === "ahorro") {
        router.push(savingsUrl([]));
        return;
      }
      router.push(`/checkout/${homeId}?plan=${plan}&guests=${guests}`);
      return;
    }

    const requiredSeatCount = guests;
    if (selectedSeatIds.length < requiredSeatCount) return;

    if (flow === "ahorro") {
      router.push(savingsUrl(selectedSeatIds));
      return;
    }

    const checkoutParams = new URLSearchParams({
      plan,
      guests: String(guests),
    });

    if (selectedSeatIds.length > 0) {
      checkoutParams.set("seatId", selectedSeatIds[0]);
      checkoutParams.set("seatIds", selectedSeatIds.join(","));
    }

    router.push(`/checkout/${homeId}?${checkoutParams.toString()}`);
  };

  const renderSeat = (row: number, column: string) => {
    const seat = seatMap.get(`${row}-${column}`);

    if (!seat) {
      return <div key={column} className="w-10 h-10" />;
    }

    const isOccupied = seat.status === "OCCUPIED";
    const isSelected = selectedSeatIdSet.has(seat.id);
    const canSelect = isSelectable(seat);
    const selectableByPlan = isSelectableByPlan(seat);
    const isVip = seat.zone === "VIP";

    let className =
      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all select-none ";

    if (isSelected) {
      className +=
        "bg-amber-400 border-amber-500 text-white cursor-pointer scale-105 shadow-md hover:bg-amber-400 hover:border-amber-500 hover:text-white";
    } else if (isOccupied) {
      className += "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
    } else if (isVip) {
      className +=
        canSelect
          ? "bg-gray-900 border-gray-700 text-white cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
          : "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed opacity-50";
    } else {
      className +=
        canSelect
          ? "bg-white border-gray-300 text-gray-800 cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
          : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50";
    }

    const seatLabel = `${column}${row}`;
    const seatContent = isOccupied ? "✕" : !selectableByPlan ? "⛔" : seatLabel;

    return (
      <button
        key={column}
        type="button"
        className={className}
        onClick={() => handleSeatClick(seat)}
        title={
          isOccupied
            ? "Asiento ocupado"
            : !canSelect
            ? plan === "vip"
              ? "Solo puedes elegir asientos VIP"
              : "Solo puedes elegir asientos Estándar"
            : `Asiento ${seatLabel}`
        }
      >
        {seatContent}
      </button>
    );
  };

  // Non-sellable seat placeholder (copilot)
  const renderNonSellableSeat = (label: string) => (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-dashed border-gray-300 bg-gray-100 text-gray-400">
      {label}
    </div>
  );

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedSeatIdSet.has(s.id)),
    [seats, selectedSeatIdSet]
  );

  if (seats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <p className="text-gray-600 font-medium">Tu cupo está reservado.</p>
          <p className="text-sm text-gray-400">
            Los asientos serán asignados por el organizador.
          </p>
        </div>
        <Button className="w-full max-w-xs" onClick={handleContinue}>
          Continuar al pago
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gray-900 border-2 border-gray-700" />
          <span>Premium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-white border-2 border-gray-300" />
          <span>Estándar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-amber-400 border-2 border-amber-500" />
          <span>Tu Selección</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-400 text-[10px] font-bold">
            ✕
          </div>
          <span>Ocupado</span>
        </div>
      </div>

      {/* Contenedor del bus */}
      <div className="bg-gray-50 border border-gray-200 rounded-3xl px-8 py-6 flex flex-col items-center gap-3 min-w-[260px]">
        {/* Chofer */}
        <div className="flex items-center justify-center gap-8 mb-2 w-full">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-500">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
              Chofer
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-500">
              <span className="text-lg">⚙</span>
            </div>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
              Motor
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-500">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
              Copiloto
            </span>
          </div>
        </div>

        {/* Zona VIP */}
        {seats.some((s) => s.zone === "VIP") && (
          <>
            <div className="bg-amber-400 text-white text-[10px] font-bold px-4 py-0.5 rounded-full tracking-wider">
              ✦ ZONA PREMIUM
            </div>
            <div className="flex flex-col gap-2">
              {BUS_LAYOUT.filter((layoutRow) =>
                seats.some(
                  (s) => s.row === layoutRow.row && s.zone === "VIP"
                )
              ).map((layoutRow) => {
                const rowSeats = layoutRow.columns.filter((c) => {
                  const seat = seatMap.get(`${layoutRow.row}-${c.label}`);
                  return seat && seat.zone === "VIP";
                });
                if (rowSeats.length === 0) return null;
                return (
                  <div
                    key={layoutRow.row}
                    className="flex items-center justify-center gap-2"
                  >
                    {renderSeat(layoutRow.row, "A")}
                    {renderSeat(layoutRow.row, "B")}
                    <span className="w-5 text-center text-[10px] text-gray-400 font-medium">
                      {layoutRow.row}
                    </span>
                    {renderSeat(layoutRow.row, "C")}
                    {renderSeat(layoutRow.row, "D")}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Divisor */}
        {seats.some((s) => s.zone === "VIP") &&
          seats.some((s) => s.zone === "STANDARD") && (
            <div className="flex items-center gap-2 w-full mt-2">
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                Zona Estándar
              </span>
              <div className="flex-1 border-t border-dashed border-gray-300" />
            </div>
          )}

        {/* Zona Estándar */}
        {seats.some((s) => s.zone === "STANDARD") && (
          <>
            {!seats.some((s) => s.zone === "VIP") && (
              <div className="bg-gray-400 text-white text-[10px] font-bold px-4 py-0.5 rounded-full tracking-wider">
                ZONA ESTÁNDAR
              </div>
            )}
            <div className="flex flex-col gap-2">
              {BUS_LAYOUT.filter((layoutRow) =>
                seats.some(
                  (s) =>
                    s.row === layoutRow.row && s.zone === "STANDARD"
                )
              ).map((layoutRow) => {
                const hasStdSeats = layoutRow.columns.some((c) => {
                  const seat = seatMap.get(`${layoutRow.row}-${c.label}`);
                  return seat && seat.zone === "STANDARD";
                });
                if (!hasStdSeats) return null;

                // Row 8 has special layout with 5 positions and copilot
                const isRow8 = layoutRow.row === 8;

                return (
                  <div
                    key={layoutRow.row}
                    className="flex items-center justify-center gap-2"
                  >
                    {isRow8 ? (
                      <>
                        {renderSeat(8, "A")}
                        {renderSeat(8, "B")}
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-gray-400 font-medium mb-0.5">
                            8
                          </span>
                          {renderNonSellableSeat("C")}
                        </div>
                        {renderSeat(8, "D")}
                        {renderSeat(8, "E")}
                      </>
                    ) : (
                      <>
                        {renderSeat(layoutRow.row, "A")}
                        {renderSeat(layoutRow.row, "B")}
                        <span className="w-5 text-center text-[10px] text-gray-400 font-medium">
                          {layoutRow.row}
                        </span>
                        {renderSeat(layoutRow.row, "C")}
                        {renderSeat(layoutRow.row, "D")}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Asiento seleccionado + botón */}
      <div className="w-full max-w-xs space-y-3 mt-2">
        {seats.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            Los asientos serán asignados por el organizador.
          </p>
        ) : selectedSeats.length > 0 ? (
          <p className="text-center text-sm font-medium text-gray-700">
            Asientos seleccionados ({selectedSeats.length}/{guests}):{" "}
            <span className="font-bold text-amber-600">
              {selectedSeats
                .map((seat) => `${seat.column}${seat.row}`)
                .join(", ")}
            </span>
          </p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            {plan === "vip"
              ? `Selecciona ${guests} asiento${guests > 1 ? "s" : ""} Premium`
              : `Selecciona ${guests} asiento${guests > 1 ? "s" : ""} Estándar`}
          </p>
        )}

        <Button
          className="w-full bg-gray-900 !text-white hover:bg-gray-800 hover:!text-white disabled:bg-gray-900/70 disabled:!text-white"
          disabled={seats.length > 0 && selectedSeatIds.length < guests}
          onClick={handleContinue}
        >
          Continuar al pago
        </Button>
      </div>
    </div>
  );
}
