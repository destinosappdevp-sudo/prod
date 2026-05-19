import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import { generateGuestConfirmationEmail } from "@/app/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que sea admin o superadmin
    const prismaAny = prisma as any;
    const dbUser = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json(
        { error: "ID de reserva requerido" },
        { status: 400 }
      );
    }

    // Obtener datos de la reserva
    const reservation = await prismaAny.reservation.findUnique({
      where: { id: reservationId },
      include: {
        User: {
          select: {
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        },
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
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    // Obtener información del host
    const host = await prismaAny.user.findUnique({
      where: { id: reservation.Home?.userId },
      select: {
        firstName: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!host || !reservation.User) {
      return NextResponse.json(
        { error: "Datos incompletos para enviar email" },
        { status: 400 }
      );
    }

    const home = reservation.Home;
    const guest = reservation.User;
    const resend = getResendClient();

    if (!resend) {
      console.error("RESEND_API_KEY no configurada; no se pudo reenviar email.");
      return NextResponse.json(
        { error: "Servicio de email no configurado" },
        { status: 500 }
      );
    }

    // Obtener información de payment y tasa BCV
    let amountUsd: number | undefined;
    let amountBs: number | undefined;
    let bcvRate: number | undefined;

    // Obtener payment relacionado a esta reserva
    const payment = await prismaAny.payment.findFirst({
      where: { reservationId: reservation.id },
      select: { paymentDetails: true },
    });

    if (payment?.paymentDetails) {
      try {
        const details = typeof payment.paymentDetails === 'string' 
          ? JSON.parse(payment.paymentDetails) 
          : payment.paymentDetails;
        
        amountUsd = details.amountUsd ? parseFloat(details.amountUsd) : undefined;
        amountBs = details.amountBs ? parseFloat(details.amountBs) : undefined;
        bcvRate = details.bcvRateUsed ? parseFloat(details.bcvRateUsed) : undefined;
      } catch (_e) {
        // Si hay error al parsear, mantener los valores como undefined
      }
    }

    // Si no tenemos bcvRate del payment, obtenerla de platform settings
    if (!bcvRate) {
      try {
        const settings = await prismaAny.platformConfig.findFirst();
        if (settings?.bcvRate) {
          bcvRate = typeof settings.bcvRate === 'string' 
            ? parseFloat(settings.bcvRate) 
            : settings.bcvRate;
        }
      } catch (_e) {
        // Si hay error, continuar sin la tasa
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

    // Enviar email al guest
    await resend.emails.send({
      from: FROM_EMAIL,
      to: guest.email,
      subject: `🎉 Recordatorio - Reserva Confirmada - ${home?.title || "Tu estadía"}`,
      html: generateGuestConfirmationEmail(emailData),
    });

    return NextResponse.json({
      success: true,
      message: "Email reenviado exitosamente",
    });
  } catch (error) {
    console.error("Error al reenviar email:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}



