import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";
import { PasadasClient } from "./client";

export const dynamic = "force-dynamic";

async function getExpiredPackages() {
  const now = new Date();
  const homes = await (prisma as any).home.findMany({
    where: {
      checkInTime: { not: null },
    },
    select: {
      id: true,
      title: true,
      photo: true,
      country: true,
      municipality: true,
      price: true,
      checkInTime: true,
      publishStatus: true,
      createdAt: true,
      destinationId: true,
      Destination: {
        select: { id: true, title: true, slug: true },
      },
      _count: {
        select: {
          Reservation: true,
          Favorite: true,
        },
      },
    },
    orderBy: { checkInTime: "desc" },
  });

  return homes
    .map((h: any) => ({
      ...h,
      checkInTime: h.checkInTime instanceof Date ? h.checkInTime : new Date(h.checkInTime),
    }))
    .filter((h: any) => h.checkInTime < now);
}

export default async function PasadasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await (prisma as any).user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!admin || admin.role !== "SUPERADMIN") redirect("/admin");

  const packages = await getExpiredPackages();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paquetes Pasados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paquetes cuya fecha de salida ya venció ({packages.length} encontrados)
        </p>
      </div>
      <PasadasClient packages={packages} />
    </div>
  );
}
