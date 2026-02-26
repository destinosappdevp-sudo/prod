import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Verificar rol en BD
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
    redirect("/");
  }

  return <>{children}</>;
}
