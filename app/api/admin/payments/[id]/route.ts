import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import {
  generateGuestConfirmationEmail,
  generateHostNotificationEmail,
} from "@/app/lib/email-templates";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    if (!["confirm", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const prismaAny = prisma as any;

    // Obtener el pago con su reserva
    const payment = await prismaAny.payment.findUnique({
      where: { id: params.id },
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
                lastName: true,
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
        where: { id: params.id },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "REJECTED",
          confirmedAt: action === "confirm" ? new Date() : null,
        },
      });

      // Actualizar la reserva
      const updatedReservation = await tx.reservation.update({
        where: { id: payment.reservationId },
        data: {
          status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
        },
      });

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
            lastName: true,
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
