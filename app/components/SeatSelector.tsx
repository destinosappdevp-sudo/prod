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

const COLUMNS = ["A", "B", "C", "D"] as const;

export default function SeatSelector({ seats, plan, homeId, flow, guests }: SeatSelectorProps) {
  const router = useRouter();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const selectedSeatIdSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);

  // Índice rápido por row+column
  const seatMap = useMemo(() => new Map(seats.map((s) => [`${s.row}-${s.column}`, s])), [seats]);

  // Obtener filas únicas por zona
  const vipRows = useMemo(
    () => Array.from(new Set(seats.filter((s) => s.zone === "VIP").map((s) => s.row))).sort((a, b) => a - b),
    [seats]
  );
  const stdRows = useMemo(
    () =>
      Array.from(new Set(seats.filter((s) => s.zone === "STANDARD").map((s) => s.row))).sort(
        (a, b) => a - b
      ),
    [seats]
  );

  const isSelectable = (seat: SeatData) => {
    if (seat.status === "OCCUPIED") return false;
    if (plan === "vip" && seat.zone !== "VIP") return false;
    if (plan === "estandar" && seat.zone !== "STANDARD") return false;
    return true;
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
    const isVip = seat.zone === "VIP";

    let className =
      "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all select-none ";

    if (isSelected) {
      className += "bg-amber-400 border-amber-500 text-white cursor-pointer scale-105 shadow-md";
    } else if (isOccupied) {
      className += "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
    } else if (isVip) {
      className +=
        canSelect
          ? "bg-gray-900 border-gray-700 text-white cursor-pointer hover:bg-gray-700"
          : "bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed opacity-50";
    } else {
      className +=
        canSelect
          ? "bg-white border-gray-300 text-gray-800 cursor-pointer hover:border-amber-400 hover:bg-amber-50"
          : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50";
    }

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
            : `Asiento ${column}${row}`
        }
      >
        {isOccupied ? "✕" : column}
      </button>
    );
  };

  const renderRow = (row: number) => (
    <div key={row} className="flex items-center justify-center gap-2">
      {/* Left pair */}
      {renderSeat(row, "A")}
      {renderSeat(row, "B")}
      {/* Row number */}
      <span className="w-6 text-center text-xs text-gray-400 font-medium">{row}</span>
      {/* Right pair */}
      {renderSeat(row, "C")}
      {renderSeat(row, "D")}
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
          <p className="text-sm text-gray-400">Los asientos serán asignados por el organizador.</p>
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
          <div className="w-5 h-5 rounded bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-400 text-[10px] font-bold">✕</div>
          <span>Ocupado</span>
        </div>
      </div>

      {/* Contenedor del bus */}
      <div className="bg-gray-50 border border-gray-200 rounded-3xl px-8 py-6 flex flex-col items-center gap-3 min-w-[220px]">
        {/* Conductor */}
        <div className="flex flex-col items-center mb-2">
          <div className="w-14 h-14 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center text-gray-500">
            <User className="w-7 h-7" />
          </div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-1">
            Conductor
          </span>
        </div>

        {/* Zona VIP */}
        {vipRows.length > 0 && (
          <>
            <div className="bg-amber-400 text-white text-[10px] font-bold px-4 py-0.5 rounded-full tracking-wider">
              ✦ ZONA PREMIUM
            </div>
            <div className="flex flex-col gap-2">
              {vipRows.map(renderRow)}
            </div>
          </>
        )}

        {/* Divisor Zona Estándar */}
        {stdRows.length > 0 && (
          <>
            <div className="flex items-center gap-2 w-full mt-2">
              <div className="flex-1 border-t border-dashed border-gray-300" />
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                Zona Estándar
              </span>
              <div className="flex-1 border-t border-dashed border-gray-300" />
            </div>
            <div className="flex flex-col gap-2">
              {stdRows.map(renderRow)}
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



