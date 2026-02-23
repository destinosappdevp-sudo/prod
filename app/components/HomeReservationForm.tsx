"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SubmitReservationButton } from "./SubmitButtons";

interface HomeReservationFormProps {
  homeId: string;
  userId: string | undefined;
  reservation: any;
  creteReservation: (formData: FormData) => Promise<void>;
}

export function HomeReservationForm({
  homeId,
  userId,
  reservation,
  creteReservation,
}: HomeReservationFormProps) {
  return (
    <form action={creteReservation}>
      <input type="hidden" name="homeId" value={homeId} />
      <input type="hidden" name="userId" value={userId} />

      {userId ? (
        <SubmitReservationButton />
      ) : (
        <Button className="w-full" asChild>
          <Link href={"/api/auth/login"}>Hacer una reserva</Link>
        </Button>
      )}
    </form>
  );
}
