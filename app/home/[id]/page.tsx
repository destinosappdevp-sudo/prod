import prisma from "@/app/lib/db";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Clock, Users, MapPin, Clock4 } from "lucide-react";
import { SupabaseImage } from "@/app/components/SupabaseImage";

const prismaAny = prisma as any;

async function getData(homeId: string) {
  noStore();
  const data = await (prisma as any).home.findUnique({
    where: { id: homeId },
    select: {
      photo: true,
      title: true,
      description: true,
      vipSeats: true,
      standardSeats: true,
      categoryName: true,
      price: true,
      priceVip: true,
      country: true,
      municipality: true,
      exactAddress: true,
      checkInTime: true,
      contactNumber: true,
      createdAt: true,
      isPrivate: true,
      privateOwnerId: true,
      Reservation: {
        where: {
          homeId: homeId,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
      Destination: {
        select: { id: true, title: true, slug: true },
      },
    },
  });
  return data;
}

async function getAmenities(homeId: string) {
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          HomeAmenity: { where: { homeId } },
        },
      },
    },
  });
  return categories.flatMap((cat: any) =>
    cat.Amenity.filter((a: any) => a.HomeAmenity.length > 0).map((a: any) => ({
      id: a.id,
      name: a.name,
      iconUrl: a.iconUrl,
      status: a.HomeAmenity[0]?.status || "UNSPECIFIED",
    }))
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getAvailableSeats(home: any) {
  const reserved = (home.Reservation || []).length;
  const total = (home.standardSeats || 0) + (home.vipSeats || 0);
  return total - reserved;
}

export default async function SingleHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const data = await getData(id);

  if (!data) {
    return (
      <div className="mx-auto mt-6 mb-12 w-full max-w-4xl px-4 sm:px-6 lg:mt-10 lg:px-8">
        <p className="text-center text-gray-500">Paquete no encontrado</p>
      </div>
    );
  }

  // Si el paquete es privado y el usuario no es el owner, mostrar mensaje
  if (data.isPrivate && data.privateOwnerId !== user?.id) {
    return (
      <div className="mx-auto mt-6 mb-12 w-full max-w-4xl px-4 sm:px-6 lg:mt-10 lg:px-8">
        <p className="text-center text-gray-500">Este paquete es privado y no está disponible.</p>
      </div>
    );
  }

  const amenities = await getAmenities(id);
  const state = getStateByValue(data?.country as string);
  const municipality =
    data?.country && data?.municipality
      ? getMunicipalityByValue(data.country, data.municipality)
      : null;

  const standardAmenities = amenities.filter((a: any) => a.status === "YES");
  const vipAmenities = amenities.filter((a: any) => a.status === "NO");
  const availableSeats = getAvailableSeats(data);

  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-4xl px-4 sm:px-6 lg:mt-10 lg:px-8">
      {data?.Destination && (
        <nav className="mb-3 text-sm text-muted-foreground">
          <Link href="/destinos" className="hover:underline">Destinos</Link>
          <span className="mx-2">·</span>
          <Link href={`/destinos/${data.Destination.slug}`} className="hover:underline">
            {data.Destination.title}
          </Link>
        </nav>
      )}

      <h1 className="font-medium text-2xl mb-5">{data?.title}</h1>

      <div className="relative h-[260px] sm:h-[360px] lg:h-[400px]">
        <SupabaseImage
          imagePath={data?.photo as string}
          alt={data?.title as string}
          fill
          className="rounded-lg object-cover w-full"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border p-5">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Salida</p>
            <p className="text-base font-bold">
              {data?.checkInTime ? formatDate(data.checkInTime) : "—"}
            </p>
            {data?.checkInTime && (
              <p className="text-sm text-gray-500">Hora {formatTime(data.checkInTime)}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-orange-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cupos</p>
            <p className="text-base font-bold">{availableSeats} libres</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border p-5">
        <h3 className="text-base font-semibold mb-3">Información de Salida</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <span className="font-medium text-gray-600">Ciudad:</span>
            <span>{municipality ? municipality.label : state?.label || "—"}</span>
          </div>
          {data?.exactAddress && (
            <div className="flex gap-2">
              <MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="font-medium text-gray-600">Punto Exacto:</span>
              <span>{data.exactAddress}</span>
            </div>
          )}
          {data?.checkInTime && (
            <div className="flex gap-2">
              <Clock4 className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
              <span className="font-medium text-gray-600">Hora de Encuentro:</span>
              <span>{formatTime(data.checkInTime)}</span>
            </div>
          )}
        </div>
      </div>

      {data?.description && (
        <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
          {data.description}
        </div>
      )}

      {data?.price && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-5">Elige tu Experiencia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-5 flex flex-col">
              <div className="mb-4">
                <p className="text-2xl font-bold">${data.price}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Plan Estándar</p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Transporte y disfrute</p>
              <ul className="space-y-2 flex-1">
                {standardAmenities.length > 0 ? standardAmenities.map((a: any) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-500 font-bold">✓</span>
                    {a.name}
                  </li>
                )) : (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-emerald-500 font-bold">✓</span>
                    Incluye transporte y disfrute
                  </li>
                )}
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                {user ? (
                  <Link
                    href={`/seats/${id}?plan=estandar&flow=ahorro`}
                    className="block w-full text-center rounded-xl border border-orange-300 text-orange-700 py-2.5 text-sm font-semibold hover:bg-orange-50 transition"
                  >
                    Ahorrar
                  </Link>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/seats/${id}?plan=estandar&flow=ahorro`)}`}
                    className="block w-full text-center rounded-xl border border-orange-300 text-orange-700 py-2.5 text-sm font-semibold hover:bg-orange-50 transition"
                  >
                    Ahorrar
                  </Link>
                )}
                {user ? (
                  <Link
                    href={`/seats/${id}?plan=estandar&flow=contado`}
                    className="block w-full text-center rounded-xl bg-orange-500 text-white py-2.5 text-sm font-semibold hover:bg-orange-600 transition"
                  >
                    Pagar de contado
                  </Link>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/seats/${id}?plan=estandar&flow=contado`)}`}
                    className="block w-full text-center rounded-xl bg-orange-500 text-white py-2.5 text-sm font-semibold hover:bg-orange-600 transition"
                  >
                    Pagar de contado
                  </Link>
                )}
              </div>
            </div>

            <div className="rounded-xl border-2 border-amber-200 p-5 flex flex-col relative">
              <div className="absolute -top-3 right-4 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                Premium VIP
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold">${data.priceVip || data.price}</p>
                <p className="text-sm font-medium text-gray-600 mt-1">Plan Premium</p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Experiencia exclusiva VIP</p>
              <ul className="space-y-2 flex-1">
                {vipAmenities.length > 0 ? vipAmenities.map((a: any) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-500">★</span>
                    {a.name}
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-amber-500">★</span>
                      Experiencia exclusiva VIP
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-amber-500">★</span>
                      Todo incluido
                    </li>
                  </>
                )}
              </ul>
              <div className="mt-6 flex flex-col gap-2">
                {user ? (
                  <Link
                    href={`/seats/${id}?plan=vip&flow=ahorro`}
                    className="block w-full text-center rounded-xl border border-amber-300 text-amber-700 py-2.5 text-sm font-semibold hover:bg-amber-50 transition"
                  >
                    Ahorrar
                  </Link>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/seats/${id}?plan=vip&flow=ahorro`)}`}
                    className="block w-full text-center rounded-xl border border-amber-300 text-amber-700 py-2.5 text-sm font-semibold hover:bg-amber-50 transition"
                  >
                    Ahorrar
                  </Link>
                )}
                {user ? (
                  <Link
                    href={`/seats/${id}?plan=vip&flow=contado`}
                    className="block w-full text-center rounded-xl bg-amber-500 text-white py-2.5 text-sm font-semibold hover:bg-amber-600 transition"
                  >
                    Pagar de contado
                  </Link>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/seats/${id}?plan=vip&flow=contado`)}`}
                    className="block w-full text-center rounded-xl bg-amber-500 text-white py-2.5 text-sm font-semibold hover:bg-amber-600 transition"
                  >
                    Pagar de contado
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
