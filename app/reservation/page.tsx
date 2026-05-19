import { redirect } from "next/navigation";

export default function ReservationPage() {
  redirect("/my-dashboard?tab=reservations");
}



