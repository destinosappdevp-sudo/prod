import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const supabaseImagesBase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`
  : "";

function resolveImageSrc(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }

  const trimmedPath = imagePath.trim();
  if (!trimmedPath) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith("/storage/v1/object/public/images/")) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}${trimmedPath}`
      : trimmedPath;
  }

  if (trimmedPath.startsWith("storage/v1/object/public/images/")) {
    return supabaseImagesBase
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${trimmedPath}`
      : `/${trimmedPath}`;
  }

  if (trimmedPath.startsWith("/")) {
    return trimmedPath;
  }

  return supabaseImagesBase
    ? `${supabaseImagesBase}/${trimmedPath.replace(/^\/+/, "")}`
    : `/${trimmedPath.replace(/^\/+/, "")}`;
}

function parseNumberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseDateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function formatCurrencyValue(amount: number, currency: "USD" | "VES"): string {
  return currency === "USD" ? `$${amount.toFixed(2)}` : `Bs ${amount.toFixed(2)}`;
}

export default async function ReservationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userSummarySelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    profileImage: true,
  } as const;

  const supabase = await createClient();
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
          select: userSummarySelect,
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
            User: {
              select: userSummarySelect,
            },
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
    const isHost = reservation.Home?.userId === user.id;

    if (!isGuest && !isHost) {
      redirect("/my-dashboard");
    }

    const propertyImageSrc = resolveImageSrc(reservation.Home?.photo);
    const guestUser = reservation.User ?? null;
    let hostUser = reservation.Home?.User ?? null;

    if (
      reservation.Home?.userId &&
      (!hostUser || hostUser.id !== reservation.Home.userId)
    ) {
      hostUser = await (prisma as any).user.findUnique({
        where: { id: reservation.Home.userId },
        select: userSummarySelect,
      });
    }

    const contactUser = isHost ? guestUser : hostUser;
    const userImageSrc = resolveImageSrc(contactUser?.profileImage);
    const showServiceFee = isHost;
    const paymentDetails =
      reservation.Payment?.paymentDetails &&
      typeof reservation.Payment.paymentDetails === "object"
        ? (reservation.Payment.paymentDetails as Record<string, unknown>)
        : null;
    const paymentCurrency =
      paymentDetails?.paymentCurrency === "VES" ? "VES" : "USD";
    const paymentSubtotalUsd = parseNumberFromUnknown(paymentDetails?.subtotalUsd);
    const paymentSubtotalBs = parseNumberFromUnknown(paymentDetails?.subtotalBs);
    const paymentServiceFeeUsd = parseNumberFromUnknown(paymentDetails?.serviceFeeUsd);
    const paymentServiceFeeBs = parseNumberFromUnknown(paymentDetails?.serviceFeeBs);
    const paymentAmountUsd = parseNumberFromUnknown(paymentDetails?.amountUsd);
    const paymentAmountBs = parseNumberFromUnknown(paymentDetails?.amountBs);
    const paymentBcvRate = parseNumberFromUnknown(paymentDetails?.bcvRateUsed);
    const paymentDate =
      parseDateFromUnknown(paymentDetails?.paymentDate) ??
      parseDateFromUnknown(reservation.Payment?.confirmedAt) ??
      parseDateFromUnknown(reservation.Payment?.createdAt);

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
                  {propertyImageSrc && (
                    <Image
                      src={propertyImageSrc}
                      alt={reservation.Home.title}
                      width={128}
                      height={128}
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
                  <div
                    className={`grid grid-cols-1 gap-4 ${
                      showServiceFee ? "md:grid-cols-3" : "md:grid-cols-2"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Subtotal</p>
                      <p className="font-semibold">
                        {formatCurrencyValue(
                          (paymentCurrency === "USD" ? paymentSubtotalUsd : paymentSubtotalBs) ??
                            reservation.Payment.subtotal,
                          paymentCurrency
                        )}
                      </p>
                    </div>
                    {showServiceFee && (
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Tarifa Servicio (descontada al anfitrión)</p>
                        <p className="font-semibold">
                          -
                          {formatCurrencyValue(
                            (paymentCurrency === "USD" ? paymentServiceFeeUsd : paymentServiceFeeBs) ??
                              reservation.Payment.serviceFee,
                            paymentCurrency
                          )}
                        </p>
                      </div>
                    )}
                    <div className="border-t-2 pt-4 md:border-t-0 md:border-l-2 md:pt-0 md:pl-4">
                      <p className="text-sm text-slate-500 mb-1">Total</p>
                      <p className="font-bold text-lg text-orange-600">
                        {formatCurrencyValue(
                          (paymentCurrency === "USD" ? paymentAmountUsd : paymentAmountBs) ??
                            reservation.Payment.amount,
                          paymentCurrency
                        )}
                      </p>
                      {paymentCurrency === "USD" && paymentAmountBs !== null && (
                        <p className="text-xs text-slate-500 mt-1">Equivalente en Bs: Bs {paymentAmountBs.toFixed(2)}</p>
                      )}
                      {paymentCurrency === "VES" && paymentAmountUsd !== null && (
                        <p className="text-xs text-slate-500 mt-1">Equivalente en USD: ${paymentAmountUsd.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {paymentCurrency === "USD" && paymentAmountBs !== null && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Total pagado (Bs)</p>
                      <p className="font-bold text-lg text-blue-600">
                        Bs {paymentAmountBs.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {paymentBcvRate !== null && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Tasa BCV aplicada</p>
                      <p className="font-semibold text-slate-800">Bs {paymentBcvRate.toFixed(6)} por USD</p>
                    </div>
                  )}

                  {paymentDate && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Fecha de pago</p>
                      <p className="font-semibold text-slate-800">
                        {paymentDate.toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        {paymentDate.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}

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
            {contactUser && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {isHost
                    ? "Información del Huésped"
                    : "Información del Anfitrión"}
                </h2>
                <div className="flex items-center gap-4">
                  {userImageSrc && (
                    <Image
                      src={userImageSrc}
                      alt={contactUser.firstName}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {contactUser.firstName} {contactUser.lastName}
                    </h3>
                    <p className="text-slate-600">{contactUser.email}</p>
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
