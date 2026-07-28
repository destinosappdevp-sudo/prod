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
  guests?: number;
}

export default function SeatSelector({
  seats,
  plan,
  homeId,
  flow,
  guests: guestsProp,
}: SeatSelectorProps) {
  const guests = guestsProp ?? 0;
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  const selectedSeatIdSet = useMemo(
    () => new Set(selectedSeatIds),
    [selectedSeatIds]
  );

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
      return [...current, seat.id];
    });
  };

  const handleContinue = () => {
    if (seats.length === 0) {
      const params = new URLSearchParams({ flow, plan });
      router.push(`/checkout/${homeId}?${params.toString()}`);
      return;
    }

    if (selectedSeatIds.length === 0) return;

    const params = new URLSearchParams({
      plan,
      flow,
      seatIds: selectedSeatIds.join(","),
    });
    router.push(`/seats/${homeId}/passengers?${params.toString()}`);
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
      className += "bg-amber-400 border-amber-500 text-white cursor-pointer scale-105 shadow-md hover:bg-amber-400 hover:border-amber-500 hover:text-white";
    } else if (isOccupied) {
      className += "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
    } else if (isVip) {
      className += canSelect
        ? "bg-gray-900 border-gray-700 text-white cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
        : "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed opacity-50";
    } else {
      className += canSelect
        ? "bg-white border-gray-300 text-gray-800 cursor-pointer hover:bg-amber-400 hover:border-amber-500 hover:text-white"
        : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50";
    }

    const seatLabel = `${column}${row}`;
    const seatContent = isOccupied ? "✕" : !selectableByPlan ? "" : seatLabel;

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

  const renderRow = (row: number) => {
    const isRow7 = row === 7;
    const isRow8 = row === 8;

    return (
      <div key={row} className="flex items-center justify-center gap-2">
        {isRow7 ? (
          <>
            {renderSeat(7, "A")}
            {renderSeat(7, "B")}
            <span className="w-12 text-center text-[9px] text-gray-400 font-semibold tracking-wider uppercase">Pasillo</span>
            <div className="w-[5.5rem] h-10 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 flex items-center justify-center">
              <span className="text-[8px] text-gray-400 font-bold tracking-wider">PUERTA</span>
            </div>
          </>
        ) : isRow8 ? (
          <>
            {renderSeat(8, "A")}
            {renderSeat(8, "B")}
            {renderSeat(8, "C")}
            {renderSeat(8, "D")}
            {renderSeat(8, "E")}
          </>
        ) : (
          <>
            {renderSeat(row, "A")}
            {renderSeat(row, "B")}
            <span className="w-12 text-center text-[9px] text-gray-400 font-semibold tracking-wider uppercase">Pasillo</span>
            {renderSeat(row, "C")}
            {renderSeat(row, "D")}
          </>
        )}
      </div>
    );
  };

  const selectedSeats = useMemo(
    () => seats.filter((s) => selectedSeatIdSet.has(s.id)),
    [seats, selectedSeatIdSet]
  );

  if (seats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <p className="text-gray-600 font-medium">Tu cupo está reservado.</p>
          <p className="text-sm text-gray-400">Los asientos serán asignados por el organizador.</p>
        </div>
        <Button className="w-full max-w-xs" onClick={handleContinue}>
          Continuar al pago
        </Button>
      </div>
    );
  }

  const hasVip = seats.some((s) => s.zone === "VIP");
  const hasStd = seats.some((s) => s.zone === "STANDARD");

  const vipRows = hasVip
    ? [...new Set(seats.filter((s) => s.zone === "VIP").map((s) => s.row))].sort((a, b) => a - b)
    : [];
  const stdRows = hasStd
    ? [...new Set(seats.filter((s) => s.zone === "STANDARD").map((s) => s.row))].sort((a, b) => a - b)
    : [];

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
          <div className="w-5 h-5 rounded bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-400 text-[10px] font-bold">✕</div>
          <span>Ocupado</span>
        </div>
      </div>

      {/* Contenedor del bus con forma de autobús */}
      <div className="relative bg-gray-50 border-4 border-gray-700 rounded-[2rem] px-6 py-5 flex flex-col items-center gap-3 min-w-[280px] shadow-xl">
        {/* Parabrisas superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3 bg-gray-600 rounded-b-lg" />

        {/* Fila frontal: Chofer + Copiloto */}
        <div className="flex items-center justify-between gap-4 mb-2 w-full pt-2">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-gray-400 bg-white flex items-center justify-center text-gray-600 shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
              Chofer
            </span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-gray-500">
              <span className="text-xs font-bold">01</span>
            </div>
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
              Copiloto
            </span>
          </div>
        </div>

        {/* Puerta Delantera (indicador lateral derecho) */}
        <div className="absolute top-20 -right-2 w-4 h-12 bg-gray-600 rounded-r-lg flex items-center justify-center">
          <span className="text-[7px] text-white font-bold writing-mode-vertical">PUERTA</span>
        </div>

        {/* Zona VIP */}
        {hasVip && (
          <>
            <div className="bg-amber-400 text-white text-[10px] font-bold px-4 py-0.5 rounded-full tracking-wider">
              ✦ ZONA PREMIUM
            </div>
            <div className="flex flex-col gap-2">
              {vipRows.map((row) => renderRow(row))}
            </div>
          </>
        )}

        {/* Divisor */}
        {hasVip && hasStd && (
          <div className="flex items-center gap-2 w-full mt-2">
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
              Zona Estándar
            </span>
            <div className="flex-1 border-t border-dashed border-gray-300" />
          </div>
        )}

        {/* Zona Estándar */}
        {hasStd && (
          <>
            {!hasVip && (
              <div className="bg-gray-400 text-white text-[10px] font-bold px-4 py-0.5 rounded-full tracking-wider">
                ZONA ESTÁNDAR
              </div>
            )}
            <div className="flex flex-col gap-2">
              {stdRows.map((row) => renderRow(row))}
            </div>
          </>
        )}

        {/* Puerta Trasera (indicador lateral derecho) */}
        <div className="absolute bottom-20 -right-2 w-4 h-12 bg-gray-600 rounded-r-lg flex items-center justify-center">
          <span className="text-[7px] text-white font-bold writing-mode-vertical">PUERTA</span>
        </div>
      </div>

      {/* Asiento seleccionado + botón */}
      <div className="w-full max-w-xs space-y-3 mt-2">
        {selectedSeats.length > 0 ? (
          <p className="text-center text-sm font-medium text-gray-700">
            Asientos ({selectedSeats.length}):{" "}
            <span className="font-bold text-amber-600">
              {selectedSeats.map((s) => `${s.column}${s.row}`).join(", ")}
            </span>
          </p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            Selecciona 1 o más asientos en el mapa
          </p>
        )}

        <Button
          className="w-full bg-gray-900 !text-white hover:bg-gray-800 hover:!text-white disabled:bg-gray-900/70 disabled:!text-white"
          disabled={seats.length > 0 && selectedSeatIds.length === 0}
          onClick={handleContinue}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
