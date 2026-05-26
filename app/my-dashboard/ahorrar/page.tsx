import { redirect } from "next/navigation";

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
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("flow", "ahorro");
  if (sp.target) params.set("target", sp.target);
  if (sp.seatId) params.set("seatId", sp.seatId);
  if (sp.seatIds) params.set("seatIds", sp.seatIds);
  if (sp.guests) params.set("guests", sp.guests);
  if (sp.plan) params.set("plan", sp.plan);

  const isGeneral = !sp.homeId || sp.target === "general";
  const targetHomeId = isGeneral ? "general" : sp.homeId!;
  if (isGeneral) params.set("target", "general");

  redirect(`/checkout/${targetHomeId}?${params.toString()}`);
}
