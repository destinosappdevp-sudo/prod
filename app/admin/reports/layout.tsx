import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

/**
 * Informes: solo SUPERADMIN.
 */
export default async function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (record?.role !== "SUPERADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}
