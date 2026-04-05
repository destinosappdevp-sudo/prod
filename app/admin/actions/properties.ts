"use server";

import { createClient } from "@/app/lib/supabase/server";
import { createAirbnbHome } from "@/app/action";
import { redirect } from "next/navigation";

export async function createAdminPackage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await createAirbnbHome({ userId: user.id });
}
