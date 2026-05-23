import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import {
  generateGuestConfirmationEmail,
  generateHostNotificationEmail,
} from "@/app/lib/email-templates";

export const dynamic = "force-dynamic";

function normalizePaymentDetails(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

async function hasApprovedPackageSavings(params: {
  tx: any;
  userId: string;
  homeId: string;
  seatId?: string | null;
}) {
  const rows = await params.tx.saving.findMany({
    where: {
      userId: params.userId,
      status: "APPROVED",
      amountUsd: { gt: 0 },
    },
    select: {
      paymentDetails: true,
      amountUsd: true,
    },
  });

  return rows.some((row: any) => {
    const details = normalizePaymentDetails(row.paymentDetails);
    const rowHomeId =
      typeof details.homeId === "string" && details.homeId.trim()
        ? details.homeId.trim()
        : null;
    if (rowHomeId !== params.homeId) return false;

    if (!params.seatId) return true;

    const rowSeatId =
      typeof details.seatId === "string" && details.seatId.trim()
        ? details.seatId.trim()
        : null;

    const rowSeatIds = Array.isArray(details.seatIds)
      ? details.seatIds
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [];

    // Compatibilidad con depósitos antiguos sin seatId explícito.
    return (
      rowSeatId === null ||
      rowSeatId === params.seatId ||
      rowSeatIds.includes(params.seatId)
    );
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      ((userRecord as any).role !== "ADMIN" &&
        (userRecord as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // "confirm" o "reject"
    const rejectionReason =
      typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Debes indicar un motivo para rechazar el pago" },
        { status: 400 }
      );
    }

    const prismaAny = prisma as any;

    // Obtener el pago con su reserva
    const payment = await prismaAny.payment.findUnique({
      where: { id },
      include: {
        Reservation: {
          include: {
            Home: {
              select: {
                title: true,
                exactAddress: true,
                municipality: true,
                country: true,
                guests: true,
                userId: true,
              },
            },
            User: {
              select: {
                firstName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Actualizar en transacción
    const result = await prismaAny.$transaction(async (tx: any) => {
      // Actualizar el pago
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "REJECTED",
          confirmedAt: action === "confirm" ? new Date() : null,
          rejectionReason: action === "reject" ? rejectionReason : null,
        },
      });

      // Actualizar la reserva
      const updatedReservation = await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
        },
      });

      // Si se rechaza el pago, solo liberar asiento si no hay saldo previo del paquete/asiento.
      if (action === "reject" && payment.Reservation?.seatId) {
        const paymentDetails = normalizePaymentDetails(payment.paymentDetails);
        const extraSeatIds = Array.isArray(paymentDetails.seatIds)
          ? paymentDetails.seatIds
              .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
              .filter(Boolean)
          : [];
        const seatIdsToRelease = Array.from(
          new Set([payment.Reservation.seatId, ...extraSeatIds])
        );

        const hasPriorSavings =
          payment.Reservation?.userId && payment.Reservation?.homeId
            ? await hasApprovedPackageSavings({
                tx,
                userId: payment.Reservation.userId,
                homeId: payment.Reservation.homeId,
                seatId: payment.Reservation.seatId,
              })
            : false;

        if (!hasPriorSavings) {
          await tx.packageSeat.updateMany({
            where: {
              id: { in: seatIdsToRelease },
              status: "OCCUPIED",
            },
            data: {
              status: "AVAILABLE",
            },
          });
        }
      }

      return { payment: updatedPayment, reservation: updatedReservation };
    });

    // Si se confirmó, enviar emails
    if (action === "confirm" && payment.Reservation) {
      try {
        // Obtener información del host
        const host = await prismaAny.user.findUnique({
          where: { id: payment.Reservation.Home?.userId },
          select: {
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        });

        console.log("📧 Preparando envío de emails de confirmación...");
        console.log(`Host encontrado: ${host?.email || "NO ENCONTRADO"}`);
        console.log(`Guest: ${payment.Reservation.User?.email || "NO ENCONTRADO"}`);

        if (host && payment.Reservation.User) {
          const resend = getResendClient();
          const reservation = payment.Reservation;
          const home = reservation.Home;
          const guest = reservation.User;

          // Extraer datos de dual currency y tasa BCV de paymentDetails
          let amountUsd: number | undefined;
          let amountBs: number | undefined;
          let bcvRate: number | undefined;

          if (payment.paymentDetails) {
            try {
              const details = typeof payment.paymentDetails === 'string' 
                ? JSON.parse(payment.paymentDetails) 
                : payment.paymentDetails;
              
              amountUsd = details.amountUsd ? parseFloat(details.amountUsd) : undefined;
              amountBs = details.amountBs ? parseFloat(details.amountBs) : undefined;
              bcvRate = details.bcvRateUsed ? parseFloat(details.bcvRateUsed) : undefined;
            } catch (_e) {
              // Si hay error al parsear, dejar los valores como undefined
            }
          }

          const emailData = {
            guestName: `${guest.firstName} ${guest.lastName}`,
            guestEmail: guest.email,
            guestPhone: guest.phoneNumber || undefined,
            hostName: `${host.firstName} ${host.lastName}`,
            hostEmail: host.email,
            hostPhone: host.phoneNumber || undefined,
            propertyTitle: home?.title || "Propiedad",
            propertyAddress: home?.exactAddress
              ? `${home.exactAddress}, ${home.municipality || ""}, ${home.country || ""}`.trim()
              : `${home?.municipality || ""}, ${home?.country || ""}`.trim(),
            checkIn: new Date(reservation.startDate).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            checkOut: new Date(reservation.endDate).toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            nights: reservation.nights,
            guests: home?.guests || "N/A",
            totalAmount: reservation.totalAmount,
            reservationId: reservation.id,
            amountUsd,
            amountBs,
            bcvRate,
          };

          if (!resend) {
            console.warn(
              "⚠️ RESEND_API_KEY no configurada; se omite el envio de emails de confirmacion."
            );
          } else {
            // Enviar email al guest
            console.log(`📨 Enviando email al guest: ${guest.email}`);
            const guestResult = await resend.emails.send({
              from: FROM_EMAIL,
              to: guest.email,
              subject: `🎉 Reserva Confirmada - ${home?.title || "Tu estadía"}`,
              html: generateGuestConfirmationEmail(emailData),
            });
            console.log(`✅ Email al guest enviado exitosamente. ID: ${guestResult.data?.id}`);

            // Enviar email al host
            console.log(`📨 Enviando email al host: ${host.email}`);
            const hostResult = await resend.emails.send({
              from: FROM_EMAIL,
              to: host.email,
              subject: `🔔 Nueva Reserva - ${home?.title || "Tu propiedad"}`,
              html: generateHostNotificationEmail(emailData),
            });
            console.log(`✅ Email al host enviado exitosamente. ID: ${hostResult.data?.id}`);

            console.log("✅ Ambos emails de confirmación enviados exitosamente");
          }
        } else {
          console.error("❌ No se pudo enviar emails: Host o Guest no encontrado");
        }
      } catch (emailError) {
        console.error("❌ Error enviando emails de confirmación:", emailError);
        // No falla la operación si el email falla
      }
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      reservation: result.reservation,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
