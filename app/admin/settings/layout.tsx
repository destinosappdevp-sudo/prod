import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

/**
 * Configuración del sistema: accesible para ADMIN y SUPERADMIN.
 * La página de settings limita qué bloques se muestran según el rol.
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

  if (record?.role !== "SUPERADMIN" && record?.role !== "ADMIN") {
    redirect("/admin");
  }

  return <>{children}</>;
}



