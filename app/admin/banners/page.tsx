import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import BannersClient from "./BannersClient";

export default async function BannersPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!userData || userData.role !== "SUPERADMIN") {
    redirect("/admin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BannersClient userId={user.id} />
    </div>
  );
}



