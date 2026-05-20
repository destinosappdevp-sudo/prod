import { SupabaseImage } from "@/app/components/SupabaseImage";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { toCategorySlug } from "@/app/lib/slug";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import FormattedDescription from "@/app/components/FormattedDescription";
import { ArrowRight, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";

const prismaAny = prisma as any;

async function getDataBySlug(slug: string) {
  noStore();
  // Los slugs tienen formato "{titulo}-{id.slice(0,6)}".
  // Extraemos el prefijo del ID (últimos 6 chars tras el último guión)
  // para buscar la propiedad aunque el campo slug ya no esté en el schema.
  const idPrefix = slug.split('-').pop() || '';
  if (!idPrefix || idPrefix.length < 4) return null;
  return await prismaAny.home.findFirst({
    where: { id: { startsWith: idPrefix } },
    select: {
                  {vipDisabled ? (
                    <>
                      <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                        Ahorrar
                      </span>
                      <span className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                        Pagar de contado
                      </span>
                      <p className="mt-2 text-xs text-gray-500">
                        {hasFullReservation
                          ? "Ya completaste el pago para este paquete."
                          : "Tienes un ahorro activo en el plan Estándar; los demás planes están bloqueados para evitar equivocaciones."}
                      </p>
                    </>
                  ) : vipSavingActive ? (
                    <>
                      <Link
                        href={vipSavingsHref}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#C49A28] transition hover:bg-[#E1B042] hover:text-white"
                      >
                        Seguir ahorrando
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={vipFinishHref}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                      >
                        Terminar de pagar
                      </Link>
                      <p className="mt-2 text-xs text-gray-500">Estás ahorrando en este plan; tus depósitos aparecen en Mi Alcancía.</p>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/seats/${data.id}?plan=vip&flow=ahorro`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#C49A28] transition hover:bg-[#E1B042] hover:text-white"
                      >
                        Ahorrar
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/seats/${data.id}?plan=vip&flow=contado`}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                      >
                        Pagar de contado
                      </Link>
                    </>
                  )}
  }));
                {(vipDisabled || vipSavingActive) && (
                  <div className="mt-3">
                    {vipDisabled && !hasFullReservation && (
                      <p className="text-xs text-gray-500">Tienes un ahorro activo en otro plan; completa o cancela ese ahorro para habilitar esta opción.</p>
                    )}
                  </div>
                )}
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDataBySlug(slug);
  if (!data) return { title: "Paquete no encontrado" };

  const baseKeywords = ["paquete turístico", "viaje Venezuela", "destinos Venezuela"];
  const titleWords = (data.title ?? "").split(/\s+/).filter((w: string) => w.length > 3);
  const categoryWord = data.categoryName ? [String(data.categoryName)] : [];
  const keywords = [...baseKeywords, ...titleWords, ...categoryWord].slice(0, 15);

  return {
    title: `${data.title} | Destinos Venezuela`,
    description: data.description?.slice(0, 160) || "Reserva tu cupo en nuestros paquetes turísticos.",
    keywords,
  };
}

async function DestinoPage({
  params,
}: {
  params: Promise<{ categorySlug: string; slug: string }>;
}) {
  const { slug, categorySlug } = await params;
  const data = await getDataBySlug(slug);

  if (!data) notFound();

  const correctCategorySlug = toCategorySlug(data.categoryName);
  if (categorySlug !== correctCategorySlug) {
    redirect(`/home/${data.id}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isApproved = data.publishStatus === "APPROVED";

  let hasFullReservation = false;
  let savingPlan: "estandar" | "vip" | null = null;

  if (user) {
    const reservation = await prismaAny.reservation.findFirst({
      where: {
        userId: user.id,
        homeId: data.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, seatId: true },
    });

    hasFullReservation = Boolean(reservation);

    if (!hasFullReservation) {
      const savingsRows = await prismaAny.saving.findMany({
        where: {
          userId: user.id,
          status: { in: ["PENDING", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
        select: { paymentDetails: true },
      });

      const savingWithSeat = savingsRows.find((row: any) => {
        const details = row?.paymentDetails && typeof row.paymentDetails === "object" ? row.paymentDetails : null;
        return details?.homeId === data.id && typeof details?.seatId === "string" && details.seatId;
      });

      const activeSeatId = savingWithSeat?.paymentDetails?.seatId;
      if (typeof activeSeatId === "string" && activeSeatId) {
        const seat = await prismaAny.packageSeat.findUnique({
          where: { id: activeSeatId },
          select: { zone: true, homeId: true },
        });

        if (seat?.homeId === data.id) {
          savingPlan = seat.zone === "VIP" ? "vip" : "estandar";
        }
      }
    }
  }

  if (!isApproved) {
    if (!user) notFound();
    const userDb = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    const canView =
      data.User?.id === user.id ||
      userDb?.role === "ADMIN" ||
      userDb?.role === "SUPERADMIN";
    if (!canView) notFound();
  }

  const amenityCategories = await getAmenities(data.id);
  const state = getStateByValue(data.country as string);
  const municipality =
    data.country && data.municipality
      ? getMunicipalityByValue(data.country, data.municipality)
      : null;

  // Formatear checkInTime: "2026-04-30T19:00" → "30-04-2026 Hora 7:00 PM"
  const formatSalidaDate = (raw: string | null): string => {
    if (!raw) return "—";
    const d = new Date(raw.includes("T") ? raw : raw + "T00:00");
    if (isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const h = d.getHours();
    const min = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const minStr = min === 0 ? "" : `:${String(min).padStart(2, "0")}`;
    return `${dd}-${mm}-${yyyy} Hora ${h12}${minStr} ${ampm}`;
  };

  // 1 hora antes para "Hora de Encuentro"
  const formatMeetupTime = (raw: string | null): string => {
    if (!raw) return "—";
    const d = new Date(raw.includes("T") ? raw : raw + "T00:00");
    if (isNaN(d.getTime())) return raw;
    d.setHours(d.getHours() - 1);
    const h = d.getHours();
    const min = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const minStr = min === 0 ? "" : `:${String(min).padStart(2, "0")}`;
    return `${h12}${minStr} ${ampm}`;
  };

  const salidaLabel = formatSalidaDate(data.checkInTime as string | null);
  const meetupLabel = formatMeetupTime(data.checkInTime as string | null);

  const standardAmenities = amenityCategories.flatMap((cat: any) =>
    cat.amenities.filter((a: any) => a.status === "YES")
  );
  const vipAmenities = amenityCategories.flatMap((cat: any) =>
    cat.amenities.filter((a: any) => a.status === "NO")
  );

  const standardDisabled = hasFullReservation || savingPlan === "vip";
  const vipDisabled = hasFullReservation || savingPlan === "estandar";
  const standardSavingActive = savingPlan === "estandar";
  const vipSavingActive = savingPlan === "vip";

  const standardSavingsPath = `/my-dashboard?tab=ahorrar&homeId=${data.id}`;
  const standardSavingsHref = user
    ? standardSavingsPath
    : `/login?next=${encodeURIComponent(standardSavingsPath)}`;
  const standardFinishPath = `/seats/${data.id}?plan=estandar&flow=contado`;
  const standardFinishHref = user
    ? standardFinishPath
    : `/login?next=${encodeURIComponent(standardFinishPath)}`;

  const vipSavingsPath = `/my-dashboard?tab=ahorrar&homeId=${data.id}`;
  const vipSavingsHref = user
    ? vipSavingsPath
    : `/login?next=${encodeURIComponent(vipSavingsPath)}`;
  const vipFinishPath = `/seats/${data.id}?plan=vip&flow=contado`;
  const vipFinishHref = user
    ? vipFinishPath
    : `/login?next=${encodeURIComponent(vipFinishPath)}`;

  return (
    <div className="mx-auto mt-4 mb-8 w-full max-w-5xl px-4 sm:px-6 lg:mt-6 lg:px-0 lg:mb-10">
      {/* Foto principal — ancho completo */}
      <div className="relative mb-6 w-full aspect-[3/2]">
        <SupabaseImage
          imagePath={data.photo as string}
          alt={data.title as string}
          fill
          className="h-full w-full rounded-2xl object-cover object-top"
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        {/* Título (ahora después de la imagen) - H1 para SEO */}
        <h1 className="mb-3 px-0 text-[1.75rem] font-bold leading-tight sm:text-[2rem]">{data.title}</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 border border-gray-200 rounded-2xl mb-6 overflow-hidden">
        <div className="flex flex-col items-center gap-1 py-5">
          <Clock className="w-6 h-6 text-gray-500" />
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Salida</p>
          <p className="font-semibold text-base">{salidaLabel}</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-5">
          <Users className="w-6 h-6 text-emerald-500" />
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Cupos</p>
          <p className="font-semibold text-base text-emerald-600">
            {data.guests ? `${data.guests} libres` : "—"}
          </p>
        </div>
      </div>

      {/* Información de Salida */}
      <div className="mb-6">
        <div className="border border-gray-200 rounded-2xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-base mb-4">
            <MapPin className="w-4 h-4 text-gray-500" />
            Información de Salida
          </h2>
          <div className="space-y-4">
            {(state || municipality) && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Ciudad</p>
                  <p className="text-sm font-medium">{municipality ? municipality.label : state?.label}</p>
                </div>
              </div>
            )}
            {data.exactAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Punto Exacto</p>
                  <p className="text-sm font-medium">{data.exactAddress}</p>
                </div>
              </div>
            )}
            {data.checkInTime && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hora de Encuentro</p>
                  <p className="text-sm font-medium">{meetupLabel}</p>
                </div>
              </div>
            )}
            {!state && !municipality && !data.exactAddress && !data.checkInTime && (
              <p className="text-sm text-gray-500">Los detalles de salida estarán disponibles pronto.</p>
            )}
          </div>
        </div>
      </div>

      {/* Descripción */}
      {data.description && (
        <div className="mb-6">
          <FormattedDescription
            text={data.description}
            className="text-gray-600 leading-relaxed"
          />
        </div>
      )}

      {/* Elige tu Experiencia */}
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-6">Elige tu Experiencia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Plan Estándar */}
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg">Plan Estándar</h3>
              <span className="font-bold text-xl">${data.price}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Transporte y disfrute</p>
            <ul className="space-y-2 mb-6">
              {standardAmenities.slice(0, 6).map((a: any) => (
                <li key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                  {a.iconUrl ? (
                    <Image src={a.iconUrl} alt={a.name} width={16} height={16} className="w-4 h-4" />
                  ) : (
                    <span className="text-emerald-500">✓</span>
                  )}
                  {a.name}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row">
              {standardDisabled ? (
                <>
                  <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                    Ahorrar
                  </span>
                  <span className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                    Pagar de contado
                  </span>
                  <p className="mt-2 text-xs text-gray-500">
                    {hasFullReservation
                      ? "Ya completaste el pago para este paquete."
                      : "Tienes un ahorro activo en el plan Premium; los demás planes están bloqueados para evitar equivocaciones."}
                  </p>
                </>
              ) : standardSavingActive ? (
                <>
                  <Link
                    href={standardSavingsHref}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#A67C12] transition hover:bg-[#E1B042] hover:text-white"
                  >
                    Seguir ahorrando
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={standardFinishHref}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                  >
                    Terminar de pagar
                  </Link>
                  <p className="mt-2 text-xs text-gray-500">Estás ahorrando en este plan; tus depósitos aparecen en Mi Alcancía.</p>
                </>
              ) : (
                <>
                  <Link
                    href={`/seats/${data.id}?plan=estandar&flow=ahorro`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#A67C12] transition hover:bg-[#E1B042] hover:text-white"
                  >
                    Ahorrar
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/seats/${data.id}?plan=estandar&flow=contado`}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                  >
                    Pagar de contado
                  </Link>
                </>
              )}
            </div>
            {(standardDisabled || standardSavingActive) && (
              <div className="mt-3">
                {standardDisabled && !hasFullReservation && (
                  <p className="text-xs text-gray-500">Tienes un ahorro activo en otro plan; completa o cancela ese ahorro para habilitar esta opción.</p>
                )}
              </div>
            )}
          </div>

          {/* Plan Premium */}
          <div className="border-2 border-[#E1B042] rounded-2xl p-6 relative">
            <div className="absolute top-0 right-0 bg-[#E1B042] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl tracking-wide">
              PREMIUM VIP
            </div>
            <div className="flex items-start justify-between mt-2 mb-1">
              <h3 className="font-bold text-lg">Plan Premium</h3>
              {data.priceVip ? (
                <span className="font-bold text-xl text-[#C49A28]">${data.priceVip}</span>
              ) : null}
            </div>
            {vipAmenities.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">Experiencia exclusiva VIP</p>
                <ul className="space-y-2 mb-6">
                  {vipAmenities.slice(0, 6).map((a: any) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                      {a.iconUrl ? (
                        <Image src={a.iconUrl} alt={a.name} width={16} height={16} className="w-4 h-4" />
                      ) : (
                        <span className="text-[#E1B042]">★</span>
                      )}
                      {a.name}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {vipDisabled ? (
                    <>
                      <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                        Ahorrar
                      </span>
                      <span className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed">
                        Pagar de contado
                      </span>
                    </>
                  ) : vipSavingActive ? (
                    <>
                      <Link
                        href={vipSavingsHref}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#C49A28] transition hover:bg-[#E1B042] hover:text-white"
                      >
                        Seguir ahorrando
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={vipFinishHref}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                      >
                        Terminar de pagar
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/seats/${data.id}?plan=vip&flow=ahorro`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#C49A28] transition hover:bg-[#E1B042] hover:text-white"
                      >
                        Ahorrar
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/seats/${data.id}?plan=vip&flow=contado`}
                        className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-900 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-900 hover:text-white"
                      >
                        Pagar de contado
                      </Link>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-2">Próximamente</p>
            )}
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}

export default DestinoPage;
