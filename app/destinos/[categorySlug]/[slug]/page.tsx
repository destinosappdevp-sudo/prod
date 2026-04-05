import { SupabaseImage } from "@/app/components/SupabaseImage";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { toCategorySlug } from "@/app/lib/slug";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { Clock, Users, MapPin } from "lucide-react";
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

  const includedAmenities = amenityCategories.flatMap((cat: any) =>
    cat.amenities.filter((a: any) => a.status === "YES")
  );

  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-4xl px-4 sm:px-6 lg:mt-10 lg:px-8">
      {/* Título */}
      <h1 className="font-bold text-3xl mb-5">{data.title}</h1>

      {/* Foto principal */}
      <div className="relative h-[260px] sm:h-[360px] lg:h-[480px] mb-8">
        <SupabaseImage
          imagePath={data.photo as string}
          alt={data.title as string}
          fill
          className="rounded-2xl h-full object-cover w-full"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 divide-x divide-gray-200 border border-gray-200 rounded-2xl mb-6 overflow-hidden">
        <div className="flex flex-col items-center gap-1 py-5">
          <Clock className="w-6 h-6 text-gray-500" />
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Salida</p>
          <p className="font-semibold text-base">{data.checkInTime || "—"}</p>
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
      {(state || municipality || data.exactAddress || data.checkInTime) && (
        <div className="border border-gray-200 rounded-2xl p-6 mb-6">
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
                  <p className="text-sm font-medium">{data.checkInTime}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Descripción */}
      {data.description && (
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{data.description}</p>
        </div>
      )}

      {/* Elige tu Experiencia */}
      <div className="mb-8">
        <h2 className="font-bold text-2xl mb-6">Elige tu Experiencia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Plan Básico */}
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-bold text-lg">Plan Básico</h3>
              <span className="font-bold text-xl">${data.price}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Transporte y disfrute</p>
            <ul className="space-y-2 mb-6">
              {includedAmenities.slice(0, 6).map((a: any) => (
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
            <button className="w-full border border-gray-900 rounded-full py-2.5 text-sm font-semibold hover:bg-gray-900 hover:text-white transition">
              Seleccionar Básico
            </button>
          </div>

          {/* Plan Premium — próximamente */}
          <div className="border-2 border-[#E1B042] rounded-2xl p-6 relative">
            <div className="absolute top-0 right-0 bg-[#E1B042] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl tracking-wide">
              PREMIUM VIP
            </div>
            <h3 className="font-bold text-lg mb-1 mt-2">Plan Premium</h3>
            <p className="text-sm text-gray-400">Próximamente</p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DestinoPage;
