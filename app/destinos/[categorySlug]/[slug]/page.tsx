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
import { ArrowRight, Clock, MapPin, PiggyBank, Users } from "lucide-react";
import Image from "next/image";

const prismaAny = prisma as any;

async function getDataBySlug(slug: string) {
  noStore();
  return await prismaAny.home.findUnique({
    where: { slug },
    select: {
      id: true,
      photo: true,
      title: true,
      description: true,
      categoryName: true,
      price: true,
      priceVip: true,
      country: true,
      municipality: true,
      exactAddress: true,
      checkInTime: true,
      guests: true,
      slug: true,
      publishStatus: true,
      User: {
        select: { id: true, role: true },
      },
    },
  });
}

async function getAmenities(homeId: string) {
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { HomeAmenity: { where: { homeId } } },
      },
    },
  });

  return categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      iconUrl: amenity.iconUrl,
      status: amenity.HomeAmenity[0]?.status || "UNSPECIFIED",
    })),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; slug: string };
}): Promise<Metadata> {
  const data = await getDataBySlug(params.slug);
  if (!data) return { title: "Paquete no encontrado" };
  return {
    title: `${data.title} | Destinos Venezuela`,
    description: data.description?.slice(0, 160) || "Reserva tu cupo",
  };
}

async function DestinoPage({
  params,
}: {
  params: { categorySlug: string; slug: string };
}) {
  const data = await getDataBySlug(params.slug);

  if (!data) notFound();

  const correctCategorySlug = toCategorySlug(data.categoryName);
  if (params.categorySlug !== correctCategorySlug) {
    redirect(`/destinos/${correctCategorySlug}/${data.slug}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let hasStartedPackageSaving = false;

  if (user) {
    const userSavings = await prismaAny.saving.findMany({
      where: { userId: user.id },
      select: { paymentDetails: true },
    });

    hasStartedPackageSaving = userSavings.some((item: any) => item?.paymentDetails?.homeId === data.id);
  }

  const savingsParams = new URLSearchParams({
    tab: hasStartedPackageSaving ? "mi-alcancia" : "ahorrar",
    target: data.title || "este paquete",
    homeId: data.id,
  });
  const savingsPath = `/my-dashboard?${savingsParams.toString()}`;
  const savingsHref = user
    ? savingsPath
    : `/login?next=${encodeURIComponent(savingsPath)}`;
  const isApproved = data.publishStatus === "APPROVED";

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

  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-5xl px-4 sm:px-6 lg:mt-10 lg:px-0">
      {/* Título */}
      <h1 className="font-bold text-3xl mb-5 px-4 sm:px-6 lg:px-8">{data.title}</h1>

      {/* Foto principal — ancho completo */}
      <div className="relative aspect-[16/7] w-full mb-8">
        <SupabaseImage
          imagePath={data.photo as string}
          alt={data.title as string}
          fill
          className="rounded-2xl object-cover w-full h-full"
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8">

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

      {/* Información de Salida + ahorro */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
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

        <div className="border border-[#E1B042]/40 rounded-2xl p-4 bg-[#FBF9F2]">
          <div className="rounded-xl bg-gradient-to-r from-[#8A880F] to-[#B49B1C] p-4 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white/15 p-2">
                <PiggyBank className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Iniciar plan de ahorro</p>
                <p className="mt-1 text-sm text-white/90">
                  Paga cuotas mensuales y completa tu viaje hasta 30 días antes.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-900">Ahorra para este paquete</p>
          <p className="mt-1 text-sm text-slate-600">
            Haz tus abonos en la alcancía y usa ese saldo luego para reservar {data.title}.
          </p>

          <Link
            href={savingsHref}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#E1B042] px-4 py-2.5 text-sm font-semibold text-[#A67C12] transition hover:bg-[#E1B042] hover:text-white"
          >
            {hasStartedPackageSaving ? "Ver ahorro del paquete" : "Iniciar ahorro"}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link href="/terminos" className="mt-3 inline-block text-[11px] text-slate-500 underline hover:text-slate-700">
            Términos y condiciones del plan de ahorro aplican.
          </Link>
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
            <Link
              href={`/checkout/${data.id}?plan=estandar&guests=1`}
              className="block w-full text-center border border-gray-900 rounded-full py-2.5 text-sm font-semibold hover:bg-gray-900 hover:text-white transition"
            >
              Seleccionar Estándar
            </Link>
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
                <Link
                  href={`/checkout/${data.id}?plan=vip&guests=1`}
                  className="block w-full text-center border-2 border-[#E1B042] rounded-full py-2.5 text-sm font-semibold text-[#C49A28] hover:bg-[#E1B042] hover:text-white transition"
                >
                  Seleccionar Premium
                </Link>
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
