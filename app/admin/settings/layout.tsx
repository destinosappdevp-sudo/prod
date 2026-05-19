import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

/**
 * Configuración del sistema: solo SUPERADMIN.
 * ADMIN u otros roles redirigen al dashboard de admin.
 */
export default async function AdminSettingsLayout({
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



