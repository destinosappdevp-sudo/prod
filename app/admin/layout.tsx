import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import { unstable_noStore } from 'next/cache';
import prisma from "@/app/lib/db";
import { AdminShell } from "./components/AdminShell";
import UserNav from "@/app/components/UserNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Verificar rol en BD - select only role para optimizar
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const allowedRoles = ["ADMIN", "SUPERADMIN"];
  if (!userRecord || !allowedRoles.includes(userRecord.role)) {
    redirect("/");
  }

  const userName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user.email?.split("@")[0];

  return (
    <AdminShell userName={userName} role={userRecord.role} headerRight={<UserNav />}>
      {children}
    </AdminShell>
  );
}



