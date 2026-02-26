import { redirect } from "next/navigation";

export default function FavoritesPage() {
  redirect("/my-dashboard?tab=favorites");
}
