"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import SelectCalendar from "./SelectCalendar";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface HomeReservationFormProps {
  homeId: string;
  userId: string | undefined;
  reservation: any;
  price: number;
  maxGuests?: number;
}

export function HomeReservationForm({
  homeId,
  userId,
  reservation,
  price,
  maxGuests,
}: HomeReservationFormProps) {
  const router = useRouter();
  const guestLimit = maxGuests && maxGuests > 0 ? maxGuests : Infinity;
  const [guests, setGuests] = useState(1);
  const initialStartDate = new Date();
  const initialEndDate = new Date(initialStartDate);
  initialEndDate.setDate(initialStartDate.getDate() + 1);
  const [dates, setDates] = useState({
    startDate: initialStartDate,
    endDate: initialEndDate,
  });

  const handleReservation = () => {
    if (!userId) {
      router.push("/api/auth/login");
      return;
    }

    if (dates.endDate.getTime() <= dates.startDate.getTime()) {
      alert("Selecciona una fecha de salida posterior a la de entrada.");
      return;
    }

    if (guestLimit !== Infinity && guests > guestLimit) {
      alert(`Esta propiedad admite máximo ${guestLimit} cupo${guestLimit !== 1 ? "s" : ""}.`);
      return;
    }

    const searchParams = new URLSearchParams({
      startDate: dates.startDate.toISOString(),
      endDate: dates.endDate.toISOString(),
      guests: guests.toString(),
    });

    router.push(`/checkout/${homeId}?${searchParams.toString()}`);
  };

  return (
    <div className="w-full lg:w-1/3">
      <div className="border rounded-xl p-6 lg:sticky lg:top-20">
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-2xl font-bold">${price}</h3>
          <span className="text-gray-600">noche por persona</span>
        </div>

        <Separator className="my-4" />

        <SelectCalendar 
          reservation={reservation} 
          onDatesChange={setDates}
        />

        <Separator className="my-4" />

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">
            Cupos
            {guestLimit !== Infinity && (
              <span className="text-xs text-gray-500 font-normal ml-1">(máx. {guestLimit})</span>
            )}
          </p>
          <div className="flex items-center justify-between border rounded-lg px-4 py-2">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="text-xl font-semibold text-gray-600 hover:text-gray-900 w-8 h-8"
            >
              −
            </button>
            <span className="font-medium">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(guestLimit === Infinity ? 99 : guestLimit, guests + 1))}
              disabled={guestLimit !== Infinity && guests >= guestLimit}
              className={`text-xl font-semibold w-8 h-8 ${
                guestLimit !== Infinity && guests >= guestLimit
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              +
            </button>
          </div>
        </div>

        {userId ? (
          <Button onClick={handleReservation} className="w-full">
            Hacer una reserva
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={"/api/auth/login"}>Hacer una reserva</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
