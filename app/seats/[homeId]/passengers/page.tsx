import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";

const prismaAny = prisma as any;

async function getPackageWithSeats(homeId: string) {
  noStore();
  return prismaAny.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      title: true,
      guests: true,
      PackageSeat: {
        select: {
          id: true,
          zone: true,
          status: true,
        },
      },
    },
  });
}

export default async function PassengersPage({
  params,
  searchParams,
}: {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ plan?: string; flow?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { homeId } = await params;
  const { plan: planParam, flow: flowParam } = await searchParams;
  const plan = planParam === "vip" ? "vip" : "estandar";
  const flow = flowParam === "ahorro" ? "ahorro" : "contado";

  if (!user) {
    redirect(
      `/login?next=/seats/${homeId}/passengers?plan=${plan}&flow=${flow}`
    );
  }

  const home = await getPackageWithSeats(homeId);
  if (!home) notFound();

  const zone = plan === "vip" ? "VIP" : "STANDARD";
  const seats = home.PackageSeat ?? [];
  const hasSeatMapForPlan = seats.some((seat: any) => seat.zone === zone);
  const availableSeats = seats.filter(
    (seat: any) => seat.zone === zone && seat.status === "AVAILABLE"
  ).length;

  const parsedGuests = Number.parseInt(String(home.guests ?? "0"), 10);
  const propertyMaxGuests = Number.isInteger(parsedGuests) && parsedGuests > 0 ? parsedGuests : 1;
  const maxPassengers = hasSeatMapForPlan ? availableSeats : propertyMaxGuests;
  const passengerOptions = Array.from(
    { length: Math.max(0, maxPassengers) },
    (_, idx) => idx + 1
  );

  const planLabel = plan === "vip" ? "Plan Premium VIP" : "Plan Estándar";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/home/${homeId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Cantidad de Pasajeros</h1>
          <p className="text-sm text-gray-500 mt-1">
            {home.title} · <span className="font-medium text-gray-700">{planLabel}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Pasajeros</p>
            <p className="text-xs text-gray-400 mt-1">
              Máximo disponible para este plan: {maxPassengers}
            </p>
          </div>

          {maxPassengers <= 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              No hay cupos disponibles para este plan en este momento.
            </p>
          )}

          <form action={`/seats/${homeId}`} method="get" className="space-y-4">
            <input type="hidden" name="plan" value={plan} />
            <input type="hidden" name="flow" value={flow} />

            <select
              name="guests"
              defaultValue="1"
              disabled={maxPassengers <= 0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {passengerOptions.map((value) => (
                <option key={value} value={value}>
                  {value} pasajero{value > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={maxPassengers <= 0}
              className="w-full rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Continuar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
