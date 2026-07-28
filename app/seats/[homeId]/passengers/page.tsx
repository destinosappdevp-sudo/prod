import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import PassengersClient from "./PassengersClient";

const prismaAny = prisma as any;

async function getSelectedSeats(homeId: string, seatIds: string[]) {
  noStore();
  if (seatIds.length === 0) return [];
  return prismaAny.packageSeat.findMany({
    where: {
      homeId,
      id: { in: seatIds },
    },
    select: {
      id: true,
      zone: true,
      row: true,
      column: true,
    },
    orderBy: [{ row: "asc" }, { column: "asc" }],
  });
}

async function getHomeTitle(homeId: string) {
  noStore();
  const home = await prismaAny.home.findUnique({
    where: { id: homeId },
    select: { title: true },
  });
  return home?.title ?? null;
}

export default async function PassengersPage({
  params,
  searchParams,
}: {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ plan?: string; flow?: string; seatIds?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { homeId } = await params;
  const { plan: planParam, flow: flowParam, seatIds: seatIdsParam } = await searchParams;

  const plan = planParam === "vip" ? "vip" : "estandar";
  const flow = flowParam === "ahorro" ? "ahorro" : "contado";

  if (!user) {
    redirect(`/login?next=/seats/${homeId}/passengers?plan=${plan}&flow=${flow}`);
  }

  const seatIds = (seatIdsParam || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (seatIds.length === 0) {
    redirect(`/seats/${homeId}?plan=${plan}&flow=${flow}`);
  }

  const seats = await getSelectedSeats(homeId, seatIds);
  if (seats.length === 0) {
    redirect(`/seats/${homeId}?plan=${plan}&flow=${flow}`);
  }

  const homeTitle = await getHomeTitle(homeId);

  const currentUser = {
    id: user.id,
    firstName: user.user_metadata?.first_name ?? user.user_metadata?.name ?? "",
    email: user.email ?? "",
    cedula: "",
  };

  // Try to get cedula from prisma user
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { cedula: true, firstName: true },
    });
    if (prismaUser) {
      currentUser.cedula = prismaUser.cedula ?? "";
      if (prismaUser.firstName && !currentUser.firstName) {
        currentUser.firstName = prismaUser.firstName;
      }
    }
  } catch {
    // ignore
  }

  const planLabel = plan === "vip" ? "Plan Premium VIP" : "Plan Estándar";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/seats/${homeId}?plan=${plan}&flow=${flow}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a asientos
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Datos de Pasajeros</h1>
          <p className="text-sm text-gray-500 mt-1">
            {homeTitle} &nbsp;·&nbsp; <span className="font-medium text-gray-700">{planLabel}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {seats.length} asiento{seats.length > 1 ? "s" : ""} seleccionado{seats.length > 1 ? "s" : ""}
          </p>
        </div>

        <PassengersClient
          homeId={homeId}
          plan={plan}
          flow={flow}
          seats={seats}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
