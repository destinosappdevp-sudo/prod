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
      if (payment.status !== "PENDING") {
        throw new Error("Solo se pueden procesar pagos en estado pendiente");
      }

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

      if (action === "reject" && payment.Reservation?.userId) {
        const paymentDetails = normalizePaymentDetails(payment.paymentDetails);
        const extraSeatIds = Array.isArray(paymentDetails.seatIds)
          ? paymentDetails.seatIds
              .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
              .filter(Boolean)
          : [];
        const seatIdsToRelease = Array.from(
          new Set([
            ...(payment.Reservation?.seatId ? [payment.Reservation.seatId] : []),
            ...extraSeatIds,
          ])
        );

        const relatedSavings = await tx.saving.findMany({
          where: {
            userId: payment.Reservation.userId,
          },
          select: {
            id: true,
            paymentDetails: true,
          },
        });

        const checkoutDebitIds: string[] = [];
        const reversalIds: string[] = [];

        for (const row of relatedSavings as Array<{ id: string; paymentDetails: unknown }>) {
          const details = normalizePaymentDetails(row.paymentDetails);
          const rowKind = typeof details.kind === "string" ? details.kind : null;
          const rowPaymentId =
            typeof details.paymentId === "string" && details.paymentId.trim()
              ? details.paymentId.trim()
              : null;
          const rowReservationId =
            typeof details.reservationId === "string" && details.reservationId.trim()
              ? details.reservationId.trim()
              : null;

          if (rowPaymentId !== payment.id && rowReservationId !== payment.reservationId) {
            continue;
          }

          if (rowKind === "CHECKOUT_DEBIT") {
            checkoutDebitIds.push(row.id);
            continue;
          }

          // Limpia reversas antiguas creadas por la lógica previa para que no inflen saldo.
          if (rowKind === "CHECKOUT_DEBIT_REVERSAL") {
            reversalIds.push(row.id);
          }
        }

        if (checkoutDebitIds.length > 0) {
          await tx.saving.updateMany({
            where: {
              id: { in: checkoutDebitIds },
            },
            data: {
              status: "REJECTED",
              rejectionReason: "Débito anulado por rechazo del pago mixto",
            },
          });
        }

        if (reversalIds.length > 0) {
          await tx.saving.updateMany({
            where: {
              id: { in: reversalIds },
            },
            data: {
              status: "REJECTED",
              rejectionReason: "Reversa anulada para evitar duplicidad de saldo",
            },
          });
        }

        // Si al rechazar el pago el saldo aprobado para ese paquete queda en 0,
        // cancelar reservas pendientes sin pago confirmado y liberar asientos.
        if (payment.Reservation?.homeId) {
          const approvedRows = await tx.saving.findMany({
            where: {
              userId: payment.Reservation.userId,
              status: "APPROVED",
            },
            select: {
              amountUsd: true,
              paymentDetails: true,
            },
          });

          const approvedPackageBalanceUsd = Number(
            approvedRows
              .reduce((sum: number, row: any) => {
                const details = normalizePaymentDetails(row.paymentDetails);
                if (details.kind === "CHECKOUT_DEBIT_REVERSAL") {
                  return sum;
                }

                const rowHomeId =
                  typeof details.homeId === "string" && details.homeId.trim()
                    ? details.homeId.trim()
                    : null;

                if (rowHomeId !== payment.Reservation.homeId) {
                  return sum;
                }

                return sum + Number(row.amountUsd ?? 0);
              }, 0)
              .toFixed(2)
          );

          if (approvedPackageBalanceUsd <= 0) {
            const pendingReservations = await tx.reservation.findMany({
              where: {
                userId: payment.Reservation.userId,
                homeId: payment.Reservation.homeId,
                status: "PENDING",
              },
              select: {
                id: true,
                seatId: true,
                Payment: {
                  select: {
                    status: true,
                    amount: true,
                  },
                },
              },
            });

            const unpaidPendingReservations = pendingReservations.filter((row: any) => {
              const paymentStatus =
                typeof row?.Payment?.status === "string" ? row.Payment.status : null;
              const amount = Number(row?.Payment?.amount ?? 0);
              if (!row?.Payment) return true;
              if (paymentStatus === "CONFIRMED") return false;
              return amount <= 0 || paymentStatus === "PENDING" || paymentStatus === "REJECTED" || paymentStatus === "CANCELLED";
            });

            const seatsFromPendingReservations = unpaidPendingReservations
              .map((row: any) =>
                typeof row.seatId === "string" && row.seatId.trim() ? row.seatId.trim() : ""
              )
              .filter(Boolean);

            const allSeatIdsToRelease = Array.from(
              new Set([...seatIdsToRelease, ...seatsFromPendingReservations])
            );

            if (allSeatIdsToRelease.length > 0) {
              await tx.packageSeat.updateMany({
                where: {
                  id: { in: allSeatIdsToRelease },
                  status: "OCCUPIED",
                },
                data: {
                  status: "AVAILABLE",
                },
              });
            }

            const pendingReservationIds = unpaidPendingReservations
              .map((row: any) => row.id)
              .filter(Boolean);

            if (pendingReservationIds.length > 0) {
              await tx.reservation.updateMany({
                where: {
                  id: { in: pendingReservationIds },
                  status: "PENDING",
                },
                data: {
                  status: "CANCELLED",
                },
              });
            }

          }
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
    if (error instanceof Error && error.message === "Solo se pueden procesar pagos en estado pendiente") {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
