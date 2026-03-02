import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import PendingApprovalsClient from "./PendingApprovalsClient";

export default async function PendingApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Verificar que sea SUPERADMIN
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (userData?.role !== "SUPERADMIN") {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PendingApprovalsClient />
    </div>
  );
}
