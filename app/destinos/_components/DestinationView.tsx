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

async function getDestinationBySlug(slug: string, currentUserId?: string) {
  try {
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
          where: {
            publishStatus: "APPROVED",
          },
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
            isPrivate: true,
            privateOwnerId: true,
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
  } catch (error) {
    console.error('Error fetching destination:', error);
    return null;
  }
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

export default async function DestinationView({ slug }: { slug: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const destination = await getDestinationBySlug(slug, user?.id);

  if (!destination) {
    notFound();
  }

  const futureHomes = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    // Filtrar paquetes privados: solo mostrar si el usuario es el owner
    if (h.isPrivate && h.privateOwnerId !== user?.id) return false;
    const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
    return d.getTime() > Date.now();
  });

  const pastHomes = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    // Filtrar paquetes privados: solo mostrar si el usuario es el owner
    if (h.isPrivate && h.privateOwnerId !== user?.id) return false;
    const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
    return d.getTime() <= Date.now();
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 lg:px-14">
        <Link
          href="/destinos"
          className="inline-flex items-center gap-2 text-sm text-[#24336a] hover:text-[#040B42]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a destinos
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {pastHomes.length > 0 && (
              <Card className="p-6 bg-white/80">
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
              </Card>
            )}

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

          <div className="space-y-6">
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
                        className="rounded-xl border border-[#d5c9af] bg-white p-4"
                      >
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
                        <Button asChild className="mt-3 w-full bg-[#E0AE33] hover:bg-[#c99723] text-white">
                          <Link href={`/home/${home.id}`}>Comprar Paquete</Link>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}