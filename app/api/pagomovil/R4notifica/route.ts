import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getPagoMovilCredentials } from "@/app/lib/pagomovil-config";
import {
  getAllowedIps,
  getClientIp,
  isAuthorized,
  normalizeBankCode,
  normalizePhone,
} from "@/app/lib/pagomovil-auth";
import { BANKS } from "@/app/lib/paymentBanks";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import {
  generateGuestConfirmationEmail,
  generateHostNotificationEmail,
} from "@/app/lib/email-templates";

export const dynamic = "force-dynamic";

const MONTO_TOLERANCE = 0.01;
const VALID_BANK_CODES = new Set(BANKS.map((b) => b.code));
const BANK_VALUE_TO_CODE = new Map(
  BANKS.map((bank) => [bank.value, bank.code]),
);

function normalizeStoredBankCode(value: string): string {
  const asValue = BANK_VALUE_TO_CODE.get(value);
  if (asValue) return normalizeBankCode(asValue);
  return normalizeBankCode(value);
}

export async function POST(request: Request) {
  let rawBody = "";
  let body: Record<string, unknown> = {};

  try {
    const credentials = await getPagoMovilCredentials();
    const allowedIps = getAllowedIps(credentials.allowedIps.join(","));

    // 1. Validar IP
    if (allowedIps.size > 0) {
      const clientIp = getClientIp(request);
      if (!allowedIps.has(clientIp)) {
        await logR4(
          "NOTIFICA",
          rawBody,
          clientIp,
          JSON.stringify({ abono: false, reason: "IP no permitida" }),
        );
        return NextResponse.json({ abono: false }, { status: 403 });
      }
    }

    // 2. Leer body y parsear
    try {
      rawBody = await request.text();
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ abono: false }, { status: 400 });
    }

    // 3. Verificar autorización
    if (!isAuthorized(request, rawBody, credentials)) {
      await logR4(
        "NOTIFICA",
        rawBody,
        getClientIp(request),
        JSON.stringify({ abono: false, reason: "No autorizado" }),
      );
      return NextResponse.json({ abono: false }, { status: 401 });
    }

    // 4. Extraer campos
    const {
      IdComercio,
      TelefonoComercio,
      TelefonoEmisor,
      BancoEmisor,
      Monto,
      Referencia,
      CodigoRed,
    } = body;

    const referencia = String(Referencia ?? "").trim();
    const bancoEmisor = String(BancoEmisor ?? "").trim();
    const telefonoEmisor = String(TelefonoEmisor ?? "").trim();
    const codigoRed = String(CodigoRed ?? "")
      .trim()
      .padStart(2, "0");
    const montoStr = String(Monto ?? "").trim();
    const montoNum = parseFloat(montoStr);

    // 5. Solo aceptar si CodigoRed == "00" (aprobado)
    if (codigoRed !== "00") {
      await logR4(
        "NOTIFICA",
        rawBody,
        getClientIp(request),
        JSON.stringify({ abono: false, reason: `CodigoRed ${codigoRed}` }),
      );
      return NextResponse.json({ abono: false });
    }

    // 6. Validar banco conocido
    const bancoNormalizado = normalizeBankCode(bancoEmisor);
    if (!VALID_BANK_CODES.has(bancoNormalizado)) {
      await logR4(
        "NOTIFICA",
        rawBody,
        getClientIp(request),
        JSON.stringify({
          abono: false,
          reason: `Banco desconocido ${bancoNormalizado}`,
        }),
      );
      return NextResponse.json({ abono: false });
    }

    const prismaAny = prisma as any;

    // 7. Idempotencia: si ya abonamos esta referencia, devolver true
    const existing = await prismaAny.pagoMovilNotificacion.findUnique({
      where: { referencia },
    });
    if (existing && existing.abonado === true) {
      return NextResponse.json({ abono: true });
    }

    // 8. Buscar pago PENDING por banco + monto + teléfono
    const pendingCandidates = await prismaAny.payment.findMany({
      where: {
        paymentMethod: "PAGO_MOVIL",
        status: "PENDING",
        amount: {
          gte: montoNum - MONTO_TOLERANCE,
          lte: montoNum + MONTO_TOLERANCE,
        },
      },
      select: {
        id: true,
        reservationId: true,
        emisorBank: true,
        phoneNumber: true,
      },
      take: 30,
    });

    const emisorPhoneNormalized = normalizePhone(telefonoEmisor);
    const pendingPayment = pendingCandidates.find((payment: any) => {
      const paymentBank =
        typeof payment.emisorBank === "string"
          ? normalizeStoredBankCode(payment.emisorBank)
          : "";
      const paymentPhone =
        typeof payment.phoneNumber === "string"
          ? normalizePhone(payment.phoneNumber)
          : "";
      const bankMatch = paymentBank === bancoNormalizado;
      const phoneMatch =
        paymentPhone === "" || paymentPhone === emisorPhoneNormalized;
      return bankMatch && phoneMatch;
    });

    if (!pendingPayment) {
      await logR4(
        "NOTIFICA",
        rawBody,
        getClientIp(request),
        JSON.stringify({
          abono: false,
          reason: "No se encontró pago pendiente",
        }),
      );
      return NextResponse.json({ abono: false });
    }

    // 9. Transacción atómica: confirmar pago + reserva + log
    await prismaAny.$transaction(async (tx: any) => {
      await tx.payment.update({
        where: { id: pendingPayment.id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          referenceNumber: referencia,
          emisorBank: bancoNormalizado,
          phoneNumber: telefonoEmisor,
        },
      });

      if (pendingPayment.reservationId) {
        await tx.reservation.update({
          where: { id: pendingPayment.reservationId },
          data: { status: "CONFIRMED" },
        });
      }

      await tx.pagoMovilNotificacion.create({
        data: {
          referencia,
          idComercio: String(IdComercio ?? ""),
          telefonoComercio: String(TelefonoComercio ?? ""),
          telefonoEmisor,
          bancoEmisor: bancoNormalizado,
          monto: montoNum,
          codigoRed,
          paymentId: pendingPayment.id,
          abonado: true,
        },
      });
    });

    // 10. Enviar emails (fuera de la transacción)
    if (pendingPayment.reservationId) {
      try {
        const resend = getResendClient();
        if (resend) {
          const reservation = await prismaAny.reservation.findUnique({
            where: { id: pendingPayment.reservationId },
            include: { Home: true, User: true },
          });
          if (reservation && reservation.Home && reservation.User) {
            const home = reservation.Home;
            const guest = reservation.User;
            const host = await prismaAny.user.findUnique({
              where: { id: home.userId },
            });
            if (host) {
              const emailData = {
                guestName:
                  `${guest.firstName || ""} ${guest.lastName || ""}`.trim() ||
                  guest.email,
                guestEmail: guest.email,
                guestPhone: guest.phoneNumber || undefined,
                hostName:
                  `${host.firstName || ""} ${host.lastName || ""}`.trim() ||
                  host.email,
                hostEmail: host.email,
                hostPhone: host.phoneNumber || undefined,
                propertyTitle: home.title || "Propiedad",
                propertyAddress: home.exactAddress
                  ? `${home.exactAddress}, ${home.municipality || ""}, ${home.country || ""}`.trim()
                  : `${home.municipality || ""}, ${home.country || ""}`.trim(),
                checkIn: new Date(reservation.startDate).toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                ),
                checkOut: new Date(reservation.endDate).toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                ),
                nights: reservation.nights,
                guests: home.guests || "N/A",
                totalAmount: reservation.totalAmount,
                reservationId: reservation.id,
              };
              await resend.emails.send({
                from: FROM_EMAIL,
                to: guest.email,
                subject: `Reserva Confirmada - ${home.title || "Tu estadía"}`,
                html: generateGuestConfirmationEmail(emailData),
              });
              await resend.emails.send({
                from: FROM_EMAIL,
                to: host.email,
                subject: `Nueva Reserva - ${home.title || "Tu propiedad"}`,
                html: generateHostNotificationEmail(emailData),
              });
            }
          }
        }
      } catch (e) {
        console.error("[R4notifica] Error enviando emails:", e);
      }
    }

    await logR4(
      "NOTIFICA",
      rawBody,
      getClientIp(request),
      JSON.stringify({ abono: true }),
    );
    return NextResponse.json({ abono: true });
  } catch (err) {
    console.error("[R4notifica] Error interno:", err);
    await logR4(
      "NOTIFICA",
      rawBody,
      getClientIp(request),
      JSON.stringify({ abono: false, reason: "Error interno" }),
    );
    return NextResponse.json({ abono: false }, { status: 500 });
  }
}

async function logR4(
  tipo: "CONSULTA" | "NOTIFICA",
  rawPayload: string,
  clientIp: string,
  respuesta: string,
) {
  try {
    const prismaAny = prisma as any;
    await prismaAny.r4JsonLog.create({
      data: { tipo, rawPayload, clientIp, respuesta },
    });
  } catch (e) {
    console.error("[R4notifica] Error guardando log:", e);
  }
}
