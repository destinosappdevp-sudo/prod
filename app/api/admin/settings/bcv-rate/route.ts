import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

const DEFAULT_BCV_RATE_TEXT = "0,00000000";
const RATE_DECIMALS = 8;

type ParsedRate = {
  asDbValue: string;
  asDisplay: string;
};

type HistoryRow = {
  effectiveDate: Date;
  rate: unknown;
};

function normalizeRawRate(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/\s+/g, "");
  const hasComma = compact.includes(",");
  const hasDot = compact.includes(".");

  if (hasComma && hasDot) {
    if (compact.lastIndexOf(",") > compact.lastIndexOf(".")) {
      return compact.replace(/\./g, "").replace(",", ".");
    }

    return compact.replace(/,/g, "");
  }

  if (hasComma) {
    return compact.replace(",", ".");
  }

  return compact;
}

function parseRate(value: unknown): ParsedRate | null {
  const normalized = normalizeRawRate(value);
  if (!normalized || !/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  const fixed = parsed.toFixed(RATE_DECIMALS);
  return {
    asDbValue: fixed,
    asDisplay: fixed.replace(".", ","),
  };
}

function toDisplayRate(value: unknown): string {
  if (value === null || value === undefined) {
    return DEFAULT_BCV_RATE_TEXT;
  }

  const stringValue =
    typeof value === "object" && value !== null && "toString" in value
      ? (value as { toString: () => string }).toString()
      : value;

  return parseRate(stringValue)?.asDisplay ?? DEFAULT_BCV_RATE_TEXT;
}

function parseDateOrFallback(value: unknown, fallback: Date): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value as string | number | Date);
  return Number.isNaN(parsedDate.getTime())
    ? null
    : parsedDate.toISOString();
}

function parseDateStrict(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function normalizeDateOnly(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

function mapHistoryRows(rows: HistoryRow[]) {
  return rows.map((row) => ({
    fecha: toIsoOrNull(row.effectiveDate),
    tasa: toDisplayRate(row.rate),
  }));
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (record?.role !== "ADMIN" && record?.role !== "SUPERADMIN") {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const prismaAny = prisma as any;
    const [config, history] = await Promise.all([
      prismaAny.platformConfig.findFirst({
        select: {
          bcvRate: true,
          bcvRateDate: true,
          bcvProximaRate: true,
          bcvProximaRateDate: true,
        },
      }),
      prismaAny.bcvRateHistory.findMany({
        select: {
          effectiveDate: true,
          rate: true,
        },
        orderBy: { effectiveDate: "desc" },
        take: 120,
      }),
    ]);

    const proximaTasa = config?.bcvProximaRate
      ? toDisplayRate(config.bcvProximaRate)
      : null;
    const proximaTasaDate = toIsoOrNull(config?.bcvProximaRateDate);

    return NextResponse.json({
      bcvRate: toDisplayRate(config?.bcvRate),
      bcvRateDate: toIsoOrNull(config?.bcvRateDate),
      proximaTasa,
      proximaTasaDate,
      tasasAnteriores: mapHistoryRows(history),
      // Compatibilidad temporal con clientes que todavia usan los nombres viejos.
      bcvRateNextDay: proximaTasa,
      bcvRateNextDayDate: proximaTasaDate,
    });
  } catch {
    return NextResponse.json({
      bcvRate: DEFAULT_BCV_RATE_TEXT,
      bcvRateDate: null,
      proximaTasa: null,
      proximaTasaDate: null,
      tasasAnteriores: [],
      bcvRateNextDay: null,
      bcvRateNextDayDate: null,
    });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const currentRate = parseRate(body?.bcvRate ?? body?.rate);

  if (!currentRate) {
    return NextResponse.json(
      { error: "Tasa BCV inválida" },
      { status: 400 }
    );
  }

  const incomingDate = parseDateOrFallback(body?.bcvRateDate, new Date());
  if (!incomingDate) {
    return NextResponse.json(
      { error: "Fecha BCV inválida" },
      { status: 400 }
    );
  }

  const proximaRawRate =
    body?.proximaTasa ??
    body?.bcvProximaRate ??
    body?.bcvRateNextDay ??
    body?.nextDayRate;
  const proximaRawDate =
    body?.proximaTasaDate ??
    body?.bcvProximaRateDate ??
    body?.bcvRateNextDayDate ??
    body?.nextDayDate;

  const hasProximaRate = hasValue(proximaRawRate);
  const hasProximaDate = hasValue(proximaRawDate);

  if (hasProximaRate !== hasProximaDate) {
    return NextResponse.json(
      { error: "Debes indicar tasa y fecha de la próxima tasa" },
      { status: 400 }
    );
  }

  const proximaRate = hasProximaRate ? parseRate(proximaRawRate) : null;
  if (hasProximaRate && !proximaRate) {
    return NextResponse.json(
      { error: "Próxima tasa inválida" },
      { status: 400 }
    );
  }

  const proximaDate = hasProximaDate ? parseDateStrict(proximaRawDate) : null;
  if (hasProximaDate && !proximaDate) {
    return NextResponse.json(
      { error: "Fecha de la próxima tasa inválida" },
      { status: 400 }
    );
  }

  try {
    const prismaAny = prisma as any;
    const result = await prismaAny.$transaction(async (tx: any) => {
      const config = await tx.platformConfig.findFirst();

      const payload = {
        bcvRate: currentRate.asDbValue,
        bcvRateDate: incomingDate,
        bcvProximaRate: proximaRate?.asDbValue ?? null,
        bcvProximaRateDate: proximaDate ?? null,
        updatedAt: new Date(),
      };

      const saved = config
        ? await tx.platformConfig.update({
            where: { id: config.id },
            data: payload,
          })
        : await tx.platformConfig.create({
            data: {
              commissionPercent: 10,
              maintenanceMode: false,
              ...payload,
            },
          });

      const rateDate = normalizeDateOnly(incomingDate);
      await tx.bcvRateHistory.upsert({
        where: { effectiveDate: rateDate },
        update: {
          rate: currentRate.asDbValue,
        },
        create: {
          effectiveDate: rateDate,
          rate: currentRate.asDbValue,
        },
      });

      if (proximaRate && proximaDate) {
        const proximaDateOnly = normalizeDateOnly(proximaDate);
        await tx.bcvRateHistory.upsert({
          where: { effectiveDate: proximaDateOnly },
          update: {
            rate: proximaRate.asDbValue,
          },
          create: {
            effectiveDate: proximaDateOnly,
            rate: proximaRate.asDbValue,
          },
        });
      }

      const history = await tx.bcvRateHistory.findMany({
        select: {
          effectiveDate: true,
          rate: true,
        },
        orderBy: { effectiveDate: "desc" },
        take: 120,
      });

      return { saved, history };
    });

    const tasa = toDisplayRate(result.saved.bcvRate);
    const tasaDate = toIsoOrNull(result.saved.bcvRateDate);
    const proximaTasa = result.saved.bcvProximaRate
      ? toDisplayRate(result.saved.bcvProximaRate)
      : null;
    const proximaTasaDate = toIsoOrNull(result.saved.bcvProximaRateDate);

    return NextResponse.json({
      success: true,
      bcvRate: tasa,
      bcvRateDate: tasaDate,
      proximaTasa,
      proximaTasaDate,
      tasasAnteriores: mapHistoryRows(result.history),
      // Compatibilidad temporal con clientes que todavia usan los nombres viejos.
      bcvRateNextDay: proximaTasa,
      bcvRateNextDayDate: proximaTasaDate,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error al guardar" }, { status: 500 });
  }
}



