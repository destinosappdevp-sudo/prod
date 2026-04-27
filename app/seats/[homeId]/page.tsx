import { notFound, redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import SeatSelector, { SeatData } from "@/app/components/SeatSelector";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const prismaAny = prisma as any;

async function getPackageWithSeats(homeId: string) {
  noStore();
  const home = await prismaAny.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      title: true,
      vipSeats: true,
      standardSeats: true,
      slug: true,
      categoryName: true,
      PackageSeat: {
        select: {
          id: true,
          zone: true,
          row: true,
          column: true,
          status: true,
        },
        orderBy: [{ row: "asc" }, { column: "asc" }],
      },
    },
  });
  return home;
}

export default async function SeatSelectionPage({
  params,
  searchParams,
}: {
  params: { homeId: string };
  searchParams: { plan?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/seats/${params.homeId}?plan=${searchParams.plan || "estandar"}`);
  }

  const plan = searchParams.plan === "vip" ? "vip" : "estandar";

  const home = await getPackageWithSeats(params.homeId);
  if (!home) notFound();

  const seats: SeatData[] = home.PackageSeat ?? [];

  // Si no hay asientos configurados, redirigir al checkout directamente
  if (seats.length === 0) {
    redirect(`/checkout/${params.homeId}?plan=${plan}`);
  }

  const planLabel = plan === "vip" ? "Plan Premium VIP" : "Plan Estándar";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/destinos/${encodeURIComponent(home.slug || home.id)}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Elige tus Asientos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {home.title} &nbsp;·&nbsp; <span className="font-medium text-gray-700">{planLabel.toUpperCase()}</span>
          </p>
        </div>

        <SeatSelector seats={seats} plan={plan} homeId={params.homeId} />
      </div>
    </div>
  );
}
