import { notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import Link from "next/link";
import { MapPin, Phone, Calendar, Users, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReviewsSection from "@/app/components/ReviewsSection";

const prismaAny = prisma as any;

async function getDestinationBySlug(slug: string) {
  const destination = await prismaAny.destination.findUnique({
    where: { slug },
    include: {
      User: {
        select: {
          firstName: true,
          email: true,
          phoneNumber: true,
        },
      },
      Homes: {
        where: { publishStatus: "APPROVED" },
        orderBy: { checkInTime: { sort: "asc", nulls: "last" } },
        select: {
          id: true,
          title: true,
          checkInTime: true,
          price: true,
          priceVip: true,
          vipSeats: true,
          standardSeats: true,
          photo: true,
          _count: {
            select: {
              PackageSeat: true,
              Reservation: true,
            },
          },
        },
      },
      Review: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          User: {
            select: {
              firstName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: { Review: true },
      },
    },
  });

  return destination;
}

function formatDeparture(value: string | null) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return {
    full: date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function calculateAvailableSeats(home: any) {
  const total = (home.vipSeats || 0) + (home.standardSeats || 0);
  const reserved = home._count?.Reservation || 0;
  return Math.max(0, total - reserved);
}

export default async function DestinationSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);

  if (!destination) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const futureHomes = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
    return d.getTime() > Date.now();
  });

  const pastHomes = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
    return d.getTime() <= Date.now();
  });

  return (
    <div className="min-h-screen bg-[#E5DCC6]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-14">
        <Link
          href="/destinos"
          className="inline-flex items-center gap-2 text-sm text-[#24336a] hover:text-[#040B42]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a destinos
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-[#0d1f58]">{destination.title || "Sin título"}</h1>
              {destination.subtitle && (
                <p className="mt-2 text-xl text-[#24336a]">{destination.subtitle}</p>
              )}
            </div>

            {destination.photo && (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-md">
                <SupabaseImage
                  imagePath={destination.photo}
                  alt={destination.title || "Destino"}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <Card className="p-6 bg-white/80">
              <h2 className="text-xl font-semibold text-[#0d1f58] mb-3">Sobre este destino</h2>
              <p className="whitespace-pre-line text-[#24336a]">
                {destination.description || "Sin descripción"}
              </p>
            </Card>

            <Card className="p-6 bg-white/80">
              <h2 className="text-xl font-semibold text-[#0d1f58] mb-4">Próximas salidas</h2>
              {futureHomes.length === 0 ? (
                <p className="text-[#24336a]">No hay salidas programadas próximamente.</p>
              ) : (
                <div className="space-y-4">
                  {futureHomes.map((home: any) => {
                    const departure = formatDeparture(home.checkInTime);
                    const available = calculateAvailableSeats(home);
                    return (
                      <div
                        key={home.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-[#d5c9af] bg-white p-4"
                      >
                        <div className="flex items-start gap-4">
                          {home.photo ? (
                            <div className="relative w-32 h-28 shrink-0 rounded-lg overflow-hidden">
                              <SupabaseImage
                                imagePath={home.photo}
                                alt={home.title || ""}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <div>
                            <p className="font-bold text-[#0d1f58]">
                              {departure?.full || "Fecha por confirmar"}
                            </p>
                            <p className="text-sm text-gray-600">
                              E: ${home.price ?? 0}
                              {home.priceVip ? ` · VIP: $${home.priceVip}` : ""}
                            </p>
                            <p className="text-sm text-gray-600">
                              Cupos disponibles: {available}
                            </p>
                          </div>
                        </div>
                        <Button asChild className="bg-[#E0AE33] hover:bg-[#c99723] text-white">
                          <Link href={`/home/${home.id}`}>Ver paquete</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {pastHomes.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-[#0d1f58] mb-3">Salidas anteriores</h3>
                  <div className="space-y-3 opacity-70">
                    {pastHomes.map((home: any) => {
                      const departure = formatDeparture(home.checkInTime);
                      return (
                        <div
                          key={home.id}
                          className="flex items-center justify-between rounded-xl border border-[#d5c9af] bg-white p-4"
                        >
                          <p className="text-sm text-gray-600">
                            {departure?.full || "Fecha por confirmar"}
                          </p>
                          <Link
                            href={`/home/${home.id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ver
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {destination.Review.length > 0 && (
              <Card className="p-6 bg-white/80">
                <h2 className="text-xl font-semibold text-[#0d1f58] mb-4">Reseñas</h2>
                <div className="space-y-4">
                  {destination.Review.map((review: any) => (
                    <div key={review.id} className="border-b border-[#d5c9af] pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                          {review.User?.firstName?.[0] || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{review.User?.firstName || "Usuario"}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                      <p className="text-[#24336a]">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/80">
              <h3 className="text-lg font-semibold text-[#0d1f58] mb-4">Información</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#E0AE33] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0d1f58]">Punto de partida</p>
                    <p className="text-sm text-[#24336a]">
                      {[destination.exactAddress, destination.municipality, destination.country]
                        .filter(Boolean)
                        .join(", ") || "No especificado"}
                    </p>
                  </div>
                </div>
                {destination.contactNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-[#E0AE33] mt-0.5" />
                    <div>
                      <p className="font-medium text-[#0d1f58]">Contacto</p>
                      <p className="text-sm text-[#24336a]">{destination.contactNumber}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#E0AE33] mt-0.5" />
                  <div>
                    <p className="font-medium text-[#0d1f58]">Salidas</p>
                    <p className="text-sm text-[#24336a]">{destination.Homes.length} paquetes</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80">
              <h3 className="text-lg font-semibold text-[#0d1f58] mb-2">Organizador</h3>
              <p className="text-[#24336a]">{destination.User?.firstName || "Destinos Venezuela"}</p>
              <p className="text-sm text-gray-500">{destination.User?.email || "-"}</p>
            </Card>
          </div>
        </div>
      </div>

      <div className="w-full pt-0">
        <ReviewsSection />
      </div>
    </div>
  );
}
