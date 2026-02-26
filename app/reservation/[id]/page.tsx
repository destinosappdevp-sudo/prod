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
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
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
            exactAddress: true,
            municipality: true,
            country: true,
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
    const isHost =
      reservation.Home?.userId === user.id;

    if (!isGuest && !isHost) {
      redirect("/my-dashboard");
    }

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

          {/* TODO: Agregar contenido de reserva */}
          <div className="space-y-6">
            {/* Reservation Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                Información de Reserva
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">ID Reserva</p>
                  <p className="font-semibold">{params.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="font-semibold">{reservation.status}</p>
                </div>
              </div>
            </div>

            {/* Property Info */}
            {reservation.Home && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Propiedad</h2>
                <p className="text-slate-700">{reservation.Home.title}</p>
              </div>
            )}

            {/* Payment Info */}
            {reservation.Payment && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Pago</h2>
                <div className="space-y-2">
                  <p>Monto: ${reservation.Payment.amount}</p>
                  <p>Estado: {reservation.Payment.status}</p>
                </div>
              </div>
            )}

            {/* Guest/Host Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isHost ? "Información del Huésped" : "Información del Anfitrión"}
              </h2>
              {/* TODO: Agregar tarjeta de usuario */}
            </div>

            {/* Reviews Section */}
            {reservation.status === "COMPLETED" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Reseña</h2>
                {reservation.Review ? (
                  <div># {/* TODO: Mostrar reseña */}</div>
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
