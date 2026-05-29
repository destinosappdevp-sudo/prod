"use client";
import React, { useState } from "react";

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
}

const seatLabel = (zone: string, row: number, column: string) => `${column}`;

const getSeatColor = (seat: Seat, selectedSeatId?: string) => {
  if (seat.status === "OCCUPIED") return "bg-gray-200 text-gray-500 border-gray-300";
  if (seat.isSelected || seat.id === selectedSeatId) return "bg-yellow-400 text-white border-yellow-400";
  if (seat.zone === "VIP") return "bg-gray-900 text-white border-gray-900";
  if (seat.zone === "STANDARD") return "bg-gray-50 text-gray-700 border-gray-200";
  return "bg-white text-gray-700 border-gray-200";
};

const getSeatContent = (seat: Seat) => {
  if (seat.status === "OCCUPIED") return "✕";
  return seatLabel(seat.zone, seat.row, seat.column);
};

const getSeatTitle = (seat: Seat) => {
  if (seat.status === "OCCUPIED" && seat.occupant) {
    const owner = `${seat.occupant.firstName || ""} ${seat.occupant.lastName || ""}`.trim() || "Sin nombre";
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

export default function SeatMap({ seats, onSelectSeat, selectedSeatId }: SeatMapProps) {
  // Agrupar por zona y fila
  const vipRows = Array.from(new Set(seats.filter(s => s.zone === "VIP").map(s => s.row))).sort();
  const stdRows = Array.from(new Set(seats.filter(s => s.zone !== "VIP").map(s => s.row))).sort();
  const vipSeats = seats.filter(s => s.zone === "VIP");
  const stdSeats = seats.filter(s => s.zone !== "VIP");

  return (
    <div className="flex flex-col items-center w-full">
      {/* Leyenda */}
      <div className="flex gap-4 mb-4">
        <Legend color="bg-gray-900" label="Premium" />
        <Legend color="bg-gray-50 border border-gray-200" label="Estándar" />
        <Legend color="bg-yellow-400" label="Tu Selección" />
        <Legend color="bg-gray-200" label="Ocupado" />
      </div>
      <div className="rounded-2xl bg-white shadow p-6 w-full max-w-xs flex flex-col items-center">
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-2">
            <span className="text-3xl text-gray-400">👤</span>
          </div>
          <div className="text-xs text-gray-500 tracking-widest mb-2">CONDUCTOR</div>
        </div>
        {/* VIP */}
        <div className="w-full flex flex-col items-center mb-2">
          <div className="mb-1">
            <span className="bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold">+ ZONA PREMIUM</span>
          </div>
          {vipRows.map(row => (
            <div key={row} className="flex gap-2 justify-center mb-2">
              {['A','B','C','D'].map(col => {
                const seat = vipSeats.find(s => s.row === row && s.column === col);
                return seat ? (
                  <button
                    key={seat.id}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border transition-all duration-150 ${getSeatColor(seat, selectedSeatId)}`}
                    title={getSeatTitle(seat)}
                    onClick={() => {
                      if (seat.status === "OCCUPIED") return;
                      if (onSelectSeat) onSelectSeat(seat);
                    }}
                  >
                    {getSeatContent(seat)}
                  </button>
                ) : (
                  <span key={col} className="w-10 h-10" />
                );
              })}
            </div>
          ))}
        </div>
        <div className="w-full text-center text-xs text-gray-400 my-2 border-t border-dashed pt-2">ZONA ESTÁNDAR</div>
        {/* STANDARD */}
        <div className="w-full flex flex-col items-center">
          {stdRows.map(row => (
            <div key={row} className="flex gap-2 justify-center mb-2">
              {['A','B','C','D'].map(col => {
                const seat = stdSeats.find(s => s.row === row && s.column === col);
                return seat ? (
                  <button
                    key={seat.id}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border transition-all duration-150 ${getSeatColor(seat, selectedSeatId)}`}
                    title={getSeatTitle(seat)}
                    onClick={() => {
                      if (seat.status === "OCCUPIED") return;
                      if (onSelectSeat) onSelectSeat(seat);
                    }}
                  >
                    {getSeatContent(seat)}
                  </button>
                ) : (
                  <span key={col} className="w-10 h-10" />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`inline-block w-5 h-5 rounded ${color} border border-gray-300`} />
      {label}
    </div>
  );
}



