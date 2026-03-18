import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

/**
 * Vercel Cron Function
 * Ejecuta diariamente a las 00:05 UTC para actualizar la tasa BCV
 * cuando bcvProximaRateDate ha llegado
 * 
 * Requiere: CRON_SECRET en .env para autenticación
 * 
 * Configuración en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/bcv-update",
 *     "schedule": "5 0 * * *"
 *   }]
 * }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CronLog {
  id?: string;
  timestamp: Date;
  action: string;
  source?: string;
  previousRate?: string;
  newRate?: string;
  previousDate?: Date;
  newDate?: Date;
  error?: string;
  success: boolean;
}

function getInvocationSource(request: Request): "vercel-cron" | "manual" | "unknown" {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() ?? "";
  const cronHeader = request.headers.get("x-vercel-cron");

  if (cronHeader || userAgent.includes("vercel-cron")) {
    return "vercel-cron";
  }

  if (request.headers.get("authorization")) {
    return "manual";
  }

  return "unknown";
}

async function logCronAction(log: CronLog): Promise<void> {
  try {
    // Crear tabla de log si no existe (para auditoría)
    // Por ahora, logueamos en consola para máxima confiabilidad
    console.log(`[BCV_CRON] ${new Date().toISOString()} - ${log.action}`, {
      success: log.success,
      previousRate: log.previousRate,
      newRate: log.newRate,
      error: log.error,
    });
  } catch (err) {
    console.error("Error logging cron action:", err);
  }
}

export async function GET(request: Request) {
  try {
    const source = getInvocationSource(request);

    // Verificar token secreto (Vercel lo incluye automáticamente)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[BCV_CRON] Unauthorized access attempt");
      await logCronAction({
        timestamp: new Date(),
        action: "unauthorized",
        source,
        success: false,
        error: "Missing or invalid CRON_SECRET authorization",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;
    const now = new Date();

    console.log("[BCV_CRON] Invocation", {
      source,
      timestamp: now.toISOString(),
    });

    // Obtener configuración actual
    const config = await prismaAny.platformConfig.findFirst({
      select: {
        id: true,
        bcvRate: true,
        bcvRateDate: true,
        bcvProximaRate: true,
        bcvProximaRateDate: true,
      },
    });

    if (!config) {
      console.log("[BCV_CRON] No config found");
      await logCronAction({
        timestamp: now,
        action: "no_config",
        source,
        success: true,
      });
      return NextResponse.json({ 
        message: "No configuration found",
        reason: "NO_CONFIG",
        source,
        updated: false 
      });
    }

    const proximaDate = config.bcvProximaRateDate 
      ? new Date(config.bcvProximaRateDate) 
      : null;

    // Verificar si la próxima tasa debe activarse
    // Se activa cuando hemos alcanzado o superado la fecha programada
    if (!proximaDate || !config.bcvProximaRate) {
      console.log("[BCV_CRON] No próxima tasa scheduled");
      await logCronAction({
        timestamp: now,
        action: "no_next_rate",
        source,
        success: true,
      });
      return NextResponse.json({ 
        message: "No próxima tasa scheduled",
        reason: "NO_NEXT_RATE",
        source,
        updated: false,
        nextScheduled: null 
      });
    }

    // Comparar solo las fechas (sin horas) para máxima precisión
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const proximaDateOnly = new Date(
      proximaDate.getFullYear(),
      proximaDate.getMonth(),
      proximaDate.getDate()
    );

    if (todayDate < proximaDateOnly) {
      console.log(`[BCV_CRON] Próxima tasa scheduled for ${proximaDate.toISOString()}, not yet active`);
      await logCronAction({
        timestamp: now,
        action: "not_due_yet",
        source,
        success: true,
        newRate: String(config.bcvProximaRate),
        newDate: proximaDate,
      });
      return NextResponse.json({ 
        message: "Próxima tasa not yet scheduled",
        reason: "NOT_DUE_YET",
        source,
        updated: false,
        nextScheduled: proximaDate.toISOString(),
        daysRemaining: Math.ceil(
          (proximaDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
      });
    }

    // LA FECHA HA LLEGADO - ACTUALIZAR LA TASA
    const result = await prismaAny.$transaction(async (tx: any) => {
      const oldRate = config.bcvRate;
      const oldDate = config.bcvRateDate;

      // Actualizar config: cambiar próxima tasa por tasa actual
      const updated = await tx.platformConfig.update({
        where: { id: config.id },
        data: {
          bcvRate: config.bcvProximaRate,
          bcvRateDate: proximaDate,
          bcvProximaRate: null,
          bcvProximaRateDate: null,
          updatedAt: now,
        },
      });

      // Registrar en histórico
      const proximaDateOnly = new Date(
        proximaDate.getFullYear(),
        proximaDate.getMonth(),
        proximaDate.getDate()
      );
      await tx.bcvRateHistory.upsert({
        where: { effectiveDate: proximaDateOnly },
        update: {
          rate: config.bcvProximaRate,
          updatedAt: now,
        },
        create: {
          effectiveDate: proximaDateOnly,
          rate: config.bcvProximaRate,
          createdAt: now,
          updatedAt: now,
        },
      });

      return { oldRate, oldDate, updated };
    });

    const logEntry: CronLog = {
      timestamp: now,
      action: "bcvRate_updated",
      source,
      success: true,
      previousRate: String(result.oldRate),
      newRate: String(config.bcvProximaRate),
      previousDate: result.oldDate,
      newDate: proximaDate,
    };

    await logCronAction(logEntry);

    return NextResponse.json({
      success: true,
      updated: true,
      reason: "UPDATED",
      source,
      message: "BCV rate updated successfully",
      previousRate: result.oldRate,
      newRate: config.bcvProximaRate,
      newDate: proximaDate.toISOString(),
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error("[BCV_CRON] Error:", error);

    const logEntry: CronLog = {
      timestamp: new Date(),
      action: "bcvRate_update_failed",
      source: getInvocationSource(request),
      success: false,
      error: String(error),
    };

    await logCronAction(logEntry);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update BCV rate",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
