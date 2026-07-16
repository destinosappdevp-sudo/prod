import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getPagoMovilCredentials } from "@/app/lib/pagomovil-config";
import {
  getAllowedIps,
  getClientIp,
  isAuthorized,
  normalizeCedula,
} from "@/app/lib/pagomovil-auth";

export const dynamic = "force-dynamic";

const MONTO_TOLERANCE = 0.01;

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
          "CONSULTA",
          rawBody,
          clientIp,
          JSON.stringify({ status: false, reason: "IP no permitida" }),
        );
        return NextResponse.json({ status: false }, { status: 403 });
      }
    }

    // 2. Leer body como texto (para HMAC) y parsear JSON
    try {
      rawBody = await request.text();
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ status: false }, { status: 400 });
    }

    // 3. Verificar autorización HMAC/UUID
    if (!isAuthorized(request, rawBody, credentials)) {
      await logR4(
        "CONSULTA",
        rawBody,
        getClientIp(request),
        JSON.stringify({ status: false, reason: "No autorizado" }),
      );
      return NextResponse.json({ status: false }, { status: 401 });
    }

    // 4. Extraer campos
    const { IdCliente, Monto, TelefonoComercio } = body;

    if (
      typeof IdCliente !== "string" ||
      typeof Monto !== "string" ||
      typeof TelefonoComercio !== "string"
    ) {
      await logR4(
        "CONSULTA",
        rawBody,
        getClientIp(request),
        JSON.stringify({ status: false, reason: "Campos inválidos" }),
      );
      return NextResponse.json({ status: false }, { status: 400 });
    }

    const montoNum = parseFloat(Monto);
    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      await logR4(
        "CONSULTA",
        rawBody,
        getClientIp(request),
        JSON.stringify({ status: false, reason: "Monto inválido" }),
      );
      return NextResponse.json({ status: false });
    }

    // 5. Buscar pago PENDING por cédula + monto
    const cedulaNormalized = normalizeCedula(IdCliente);

    const prismaAny = prisma as any;
    const pendingPayment = await prismaAny.payment.findFirst({
      where: {
        paymentMethod: "PAGO_MOVIL",
        status: "PENDING",
        cedula: cedulaNormalized,
        amount: {
          gte: montoNum - MONTO_TOLERANCE,
          lte: montoNum + MONTO_TOLERANCE,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, cedula: true, amount: true },
    });

    if (!pendingPayment) {
      await logR4(
        "CONSULTA",
        rawBody,
        getClientIp(request),
        JSON.stringify({
          status: false,
          reason: "No se encontró pago pendiente",
        }),
      );
      return NextResponse.json({ status: false });
    }

    // 6. Todo OK
    await logR4(
      "CONSULTA",
      rawBody,
      getClientIp(request),
      JSON.stringify({ status: true }),
    );
    return NextResponse.json({ status: true });
  } catch (err) {
    console.error("[R4consulta] Error interno:", err);
    await logR4(
      "CONSULTA",
      rawBody,
      getClientIp(request),
      JSON.stringify({ status: false, reason: "Error interno" }),
    );
    return NextResponse.json({ status: false }, { status: 500 });
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
    console.error("[R4consulta] Error guardando log:", e);
  }
}
