import { unstable_noStore } from 'next/cache';
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import AlojamientosClient from "./client";
import { redirect } from "next/navigation";

export default async function AlojamientosPage() {
  unstable_noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Verificar que sea SUPERADMIN
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!currentUser || currentUser.role !== "SUPERADMIN") {
    return redirect("/");
  }

  // Obtener alojamientos pendientes
  const homes = await prisma.home.findMany({
    where: {
      publishStatus: "PENDING_APPROVAL",
    },
    select: {
      id: true,
      title: true,
      description: true,
      country: true,
      municipality: true,
      price: true,
      photo: true,
      categoryName: true,
      publishStatus: true,
      User: {
        select: {
          id: true,
          firstName: true,
          email: true,
          isVerified: true,
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const normalizedHomes = homes
    .filter((home) => !!home.User)
    .map((home) => ({
      id: home.id,
      title: home.title || "Sin título",
      description: home.description || "",
      country: home.country || "",
      municipality: home.municipality,
      price: home.price || 0,
      photo: home.photo || "",
      categoryName: home.categoryName,
      publishStatus: home.publishStatus,
      createdAt: home.createdAt,
      User: {
        id: home.User!.id,
        firstName: home.User!.firstName || "",
        lastName: "",
        email: home.User!.email,
        isVerified: home.User!.isVerified,
      },
    }));

  return <AlojamientosClient homes={normalizedHomes} userId={user.id} />;
}



