"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check, UserCircle, AlertCircle, Loader2 } from "lucide-react";

type Seat = {
  id: string;
  zone: string;
  row: number;
  column: string;
};

type CurrentUser = {
  id: string;
  firstName: string;
  email: string;
  cedula: string;
};

type PassengerState = {
  cedula: string;
  nombre: string;
  userId?: string;
  email?: string;
  saved: boolean;
  searching: boolean;
  notFound: boolean;
  error: string;
};

interface PassengersClientProps {
  homeId: string;
  plan: string;
  flow: string;
  seats: Seat[];
  currentUser: CurrentUser;
}

export default function PassengersClient({
  homeId,
  plan,
  flow,
  seats,
  currentUser,
}: PassengersClientProps) {
  const router = useRouter();
  const additionalCount = seats.length - 1;

  const [passengers, setPassengers] = useState<PassengerState[]>(
    Array.from({ length: additionalCount }, () => ({
      cedula: "",
      nombre: "",
      saved: false,
      searching: false,
      notFound: false,
      error: "",
    }))
  );

  const allSaved = passengers.every((p) => p.saved);
  const canContinue = additionalCount === 0 || allSaved;

  const handleSearch = async (index: number) => {
    const cedula = passengers[index].cedula.trim();
    if (!cedula) {
      setPassengers((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], error: "Ingresa una cédula" };
        return next;
      });
      return;
    }

    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], searching: true, error: "", notFound: false };
      return next;
    });

    try {
      const res = await fetch(`/api/users/by-cedula?cedula=${encodeURIComponent(cedula)}`);
      const data = await res.json();

      setPassengers((prev) => {
        const next = [...prev];
        if (data.found) {
          next[index] = {
            cedula: data.cedula,
            nombre: data.firstName,
            userId: data.id,
            email: data.email,
            saved: true,
            searching: false,
            notFound: false,
            error: "",
          };
        } else {
          next[index] = {
            ...next[index],
            searching: false,
            notFound: true,
            error: "",
          };
        }
        return next;
      });
    } catch {
      setPassengers((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], searching: false, error: "Error al buscar. Intenta de nuevo." };
        return next;
      });
    }
  };

  const handleNombreChange = (index: number, nombre: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], nombre, error: "" };
      return next;
    });
  };

  const handleCedulaChange = (index: number, cedula: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], cedula, error: "", notFound: false };
      return next;
    });
  };

  const handleSave = (index: number) => {
    const p = passengers[index];
    if (!p.notFound && !p.nombre.trim()) {
      setPassengers((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], error: "Ingresa el nombre completo" };
        return next;
      });
      return;
    }
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], saved: true, error: "" };
      return next;
    });
  };

  const handleEdit = (index: number) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], saved: false, notFound: next[index].nombre ? false : next[index].notFound };
      return next;
    });
  };

  const handleContinue = () => {
    const allPassengers = [
      {
        cedula: currentUser.cedula,
        nombre: currentUser.firstName,
        userId: currentUser.id,
        email: currentUser.email,
      },
      ...passengers.map((p) => ({
        cedula: p.cedula,
        nombre: p.nombre,
        ...(p.userId ? { userId: p.userId } : {}),
        ...(p.email ? { email: p.email } : {}),
      })),
    ];

    const params = new URLSearchParams({
      plan,
      flow,
      seatIds: seats.map((s) => s.id).join(","),
      passengers: JSON.stringify(allPassengers),
    });
    router.push(`/checkout/${homeId}?${params.toString()}`);
  };

  const seatLabel = (seat: Seat) => `${seat.column}${seat.row}`;

  return (
    <div className="space-y-4">
      {/* Pasajero 1: Usuario actual */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            1
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-800 text-sm">
                {currentUser.firstName || "Tu cuenta"}
              </span>
              <span className="text-xs text-gray-400 truncate">
                {currentUser.cedula || currentUser.email}
              </span>
            </div>
            <span className="text-xs text-amber-600 font-medium">
              Asiento: {seatLabel(seats[0])}
            </span>
          </div>
          <Check className="w-5 h-5 text-green-500 shrink-0" />
        </div>
      </div>

      {/* Pasajeros adicionales */}
      {passengers.map((p, i) => {
        const seat = seats[i + 1];
        if (!seat) return null;

        return (
          <div
            key={i}
            className={`rounded-xl border p-4 transition-colors ${
              p.saved
                ? "border-green-200 bg-green-50"
                : p.error
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                  p.saved ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                {i + 2}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">Pasajero {i + 2}</span>
                <span className="text-xs text-amber-600 font-medium ml-2">
                  Asiento: {seatLabel(seat)}
                </span>
              </div>
              {p.saved && (
                <button
                  type="button"
                  onClick={() => handleEdit(i)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Editar
                </button>
              )}
            </div>

            {p.saved ? (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-800">{p.nombre}</span>
                <span className="text-gray-400 text-xs">({p.cedula})</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cédula (ej: V-12345678)"
                    value={p.cedula}
                    onChange={(e) => handleCedulaChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !p.searching) {
                        e.preventDefault();
                        handleSearch(i);
                      }
                    }}
                    disabled={p.notFound && p.nombre.trim().length > 0}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(i)}
                    disabled={p.searching}
                    className="shrink-0"
                  >
                    {p.searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {p.notFound && (
                  <Input
                    placeholder="Nombre completo del pasajero"
                    value={p.nombre}
                    onChange={(e) => handleNombreChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave(i);
                      }
                    }}
                    className="w-full"
                  />
                )}

                {p.error && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {p.error}
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  {p.notFound ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSave(i)}
                      disabled={!p.nombre.trim()}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Guardar pasajero
                    </Button>
                  ) : p.nombre && !p.searching ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSave(i)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Confirmar
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Botón continuar */}
      <div className="pt-4">
        <Button
          className="w-full bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-900/70"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          {additionalCount === 0
            ? "Continuar al pago"
            : allSaved
            ? `Continuar al pago (${seats.length} pasajeros)`
            : `Completa los ${additionalCount} pasajero${additionalCount > 1 ? "s" : ""} adicional${additionalCount > 1 ? "es" : ""}`}
        </Button>
        {additionalCount > 0 && !allSaved && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Busca la cédula de cada pasajero. Si no está registrado, ingresa su nombre.
          </p>
        )}
      </div>
    </div>
  );
}
