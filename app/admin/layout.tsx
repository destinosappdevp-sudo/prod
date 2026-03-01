import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/db";
import { AdminSidebar } from "./components/AdminSidebar";
import { UserRole } from "../../ZerkkApp/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Verificar rol en BD
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!userRecord || (userRecord.role !== UserRole.ADMIN && userRecord.role !== UserRole.SUPERADMIN)) {
    redirect("/");
  }

  const userName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user.email?.split("@")[0];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar userName={userName} role={userRecord.role} />
      <main className="flex-1 ml-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
