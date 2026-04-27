import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

/**
 * Vercel Cron Function
 * Ejecuta diariamente a las 06:00 UTC para marcar como DRAFT los paquetes
 * cuya fecha de salida (checkInTime) ya pasó.
 *
 * checkInTime se almacena como String con formato "YYYY-MM-DDTHH:mm" (datetime-local).
 * Se usa CAST para comparar correctamente en PostgreSQL.
 *
 * Configuración en vercel.json:
 * { "path": "/api/cron/expire-packages", "schedule": "0 6 * * *" }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verificar token secreto
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[EXPIRE_CRON] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Usar raw SQL para comparar correctamente:
    // checkInTime es TEXT "YYYY-MM-DDTHH:mm" → CAST a TIMESTAMP y comparar con NOW()
    const result = await prisma.$executeRaw`
      UPDATE "Home"
      SET "publishStatus" = 'DRAFT'
      WHERE "publishStatus" = 'APPROVED'
        AND "checkInTime" IS NOT NULL
        AND "checkInTime" != ''
        AND CAST("checkInTime" AS TIMESTAMP) < NOW()
    `;

    console.log(
      `[EXPIRE_CRON] ${now.toISOString()} — ${result} paquete(s) pasados a DRAFT`
    );

    return NextResponse.json({
      success: true,
      expired: result,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[EXPIRE_CRON] Error:", msg);
    return NextResponse.json(
      { error: "Internal server error", detail: msg },
      { status: 500 }
    );
  }
}
