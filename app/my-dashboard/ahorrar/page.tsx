import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import SavingsPaymentClient from "@/app/components/SavingsPaymentClient";
import { getGuestDashboardData } from "../page";

export default async function SavingsPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    target?: string;
    homeId?: string;
    seatId?: string;
    seatIds?: string;
    guests?: string;
    plan?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const userRecord = await (prisma as any).user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      firstName: true,
      email: true,
    },
  });

  if (!userRecord) {
    redirect("/");
  }

  if (userRecord.role === "ADMIN" || userRecord.role === "SUPERADMIN") {
    redirect("/admin");
  }

  const sp = await searchParams;

  const savingTargetSeatIds =
    typeof sp.seatIds === "string"
      ? sp.seatIds
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : typeof sp.seatId === "string" && sp.seatId.trim()
      ? [sp.seatId.trim()]
      : [];

  const savingTargetGuestsParsed =
    typeof sp.guests === "string" ? Number.parseInt(sp.guests, 10) : NaN;
  const savingTargetGuests =
    Number.isInteger(savingTargetGuestsParsed) && savingTargetGuestsParsed > 0
      ? savingTargetGuestsParsed
      : undefined;

  const [data, savingPackage] = await Promise.all([
    getGuestDashboardData(user.id),
    typeof sp.homeId === "string"
      ? (prisma as any).home.findUnique({
          where: { id: sp.homeId },
          select: {
            id: true,
            title: true,
            photo: true,
            price: true,
            priceVip: true,
            country: true,
            municipality: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <SavingsPaymentClient
      savings={data.savings}
      savingPackages={data.savingPackages}
      bcvRate={data.bcvRate}
      savingTarget={typeof sp.target === "string" ? sp.target : undefined}
      savingTargetId={typeof sp.homeId === "string" ? sp.homeId : undefined}
      savingTargetSeatId={typeof sp.seatId === "string" ? sp.seatId : undefined}
      savingTargetSeatIds={savingTargetSeatIds}
      savingTargetGuests={savingTargetGuests}
      savingTargetPlan={sp.plan === "vip" ? "vip" : sp.plan === "estandar" ? "estandar" : undefined}
      savingPackage={savingPackage}
    />
  );
}
