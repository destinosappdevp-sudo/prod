import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    // Fetch reservation with related data
    const reservation = await (prisma as any).reservation.findUnique({
      where: { id: params.id },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
        Home: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            photo: true,
            municipality: true,
            country: true,
            userId: true,
          },
        },
        Payment: true,
        Review: true,
      },
    });

    if (!reservation) {
      redirect("/my-dashboard?tab=reservations");
    }

    // Check authorization
    const isGuest = reservation.userId === user.id;
    const homeUser = await (prisma as any).home.findUnique({
      where: { id: reservation.homeId || "" },
      select: { userId: true },
    });
    const isHost = homeUser?.userId === user.id;

    if (!isGuest && !isHost) {
      redirect("/my-dashboard");
    }

    // Format dates
    const startDate = new Date(reservation.startDate);
    const endDate = new Date(reservation.endDate);
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dateRange = `${startDate.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })}`;

    const statusColors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/my-dashboard?tab=reservations"
              className="p-2 hover:bg-slate-200 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold">Detalle de Reserva</h1>
          </div>

          <div className="space-y-6">
            {/* Reservation Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Información de Reserva
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">ID Reserva</p>
                  <p className="font-mono font-semibold text-base">
                    {`ZRK-${reservation.id.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Estado</p>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                      statusColors[reservation.status] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {reservation.status === "PENDING"
                      ? "Pendiente"
                      : reservation.status === "CONFIRMED"
                      ? "Confirmada"
                      : reservation.status === "CANCELLED"
                      ? "Cancelada"
                      : "Completada"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Fechas</p>
                  <p className="font-semibold">{dateRange}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Noches</p>
                  <p className="font-semibold">{nights} noches</p>
                </div>
              </div>
            </div>

            {/* Property Info */}
            {reservation.Home && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Propiedad</h2>
                <div className="flex gap-6">
                  {reservation.Home.photo && (
                    <img
                      src={reservation.Home.photo}
                      alt={reservation.Home.title}
                      className="w-32 h-32 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {reservation.Home.title}
                    </h3>
                    <p className="text-slate-600 mb-2">
                      {reservation.Home.municipality}, {reservation.Home.country}
                    </p>
                    {reservation.Home.description && (
                      <p className="text-sm text-slate-600">
                        {reservation.Home.description.slice(0, 150)}...
                      </p>
                    )}
                    <p className="font-semibold text-orange-600 mt-2">
                      ${reservation.Home.price}/noche
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            {reservation.Payment && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Información de Pago</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Subtotal</p>
                      <p className="font-semibold">
                        ${reservation.Payment.subtotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tarifa Servicio</p>
                      <p className="font-semibold">
                        ${reservation.Payment.serviceFee.toFixed(2)}
                      </p>
                    </div>
                    <div className="border-t-2 pt-4 md:border-t-0 md:border-l-2 md:pt-0 md:pl-4">
                      <p className="text-sm text-slate-500 mb-1">Total</p>
                      <p className="font-bold text-lg text-orange-600">
                        ${reservation.Payment.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      Método de Pago
                    </p>
                    <p className="font-semibold">
                      {reservation.Payment.paymentMethod.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Estado</p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                        reservation.Payment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : reservation.Payment.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {reservation.Payment.status === "PENDING"
                        ? "Pendiente"
                        : reservation.Payment.status === "CONFIRMED"
                        ? "Confirmado"
                        : "Rechazado"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Guest/Host Info */}
            {reservation.User && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isHost
                    ? "Información del Huésped"
                    : "Información del Anfitrión"}
                </h2>
                <div className="flex items-center gap-4">
                  {reservation.User.profileImage && (
                    <img
                      src={reservation.User.profileImage}
                      alt={reservation.User.firstName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {reservation.User.firstName} {reservation.User.lastName}
                    </h3>
                    <p className="text-slate-600">{reservation.User.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            {reservation.status === "COMPLETED" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Reseña</h2>
                {reservation.Review ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={
                              i < reservation.Review?.rating
                                ? "text-yellow-400"
                                : "text-slate-300"
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="font-semibold">
                        {reservation.Review.rating}
                      </span>
                    </div>
                    <p className="text-slate-700">{reservation.Review.comment}</p>
                    {reservation.Review.hostReply && (
                      <div className="bg-slate-50 p-4 rounded-lg mt-4">
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Respuesta del anfitrión:
                        </p>
                        <p className="text-slate-600">{reservation.Review.hostReply}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-500">
                    Aún no hay reseña para esta reserva
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching reservation:", error);
    redirect("/my-dashboard?tab=reservations");
  }
}
