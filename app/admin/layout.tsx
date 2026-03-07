import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/app/lib/db";
import { AdminSidebar } from "./components/AdminSidebar";
import UserNav from "@/app/components/UserNav";

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

  const allowedRoles = ["ADMIN", "SUPERADMIN", "BANER"];
  if (!userRecord || !allowedRoles.includes(userRecord.role)) {
    redirect("/");
  }

  const userName = user.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user.email?.split("@")[0];

  return (
    <div className="fixed inset-0 flex bg-gray-50 z-50">
      <AdminSidebar userName={userName} role={userRecord.role} />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex justify-end">
          <UserNav />
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
