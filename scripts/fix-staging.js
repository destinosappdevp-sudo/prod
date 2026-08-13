/**
 * Migración de staging (hxdhkbiwhrroeffxyxfz) para sincronizar con schema Prisma.
 *
 * Ejecutar: node scripts/fix-staging.js
 *
 * PRODUCE:
 * 1. User.lastName → nullable ( Prisma schema no lo tiene )
 * 2. User: agrega travelsWithChildren, childrenAges
 * 3. PlatformConfig: agrega 11 columnas pagomovil
 * 4. Crea tabla PagoMovilNotificacion
 * 5. Crea tabla R4JsonLog
 */
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

// Apunta a STAGING (.env). Usa DIRECT_URL para evitar el pooler en ALTER TABLE.
const STAGING_DB = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function run() {
  const prisma = new PrismaClient({
    datasources: { db: { url: STAGING_DB } },
  });

  const sql = (q) => prisma.$executeRawUnsafe(q);

  try {
    console.log("=== Migración STAGING ===\n");

    // ── 1. User.lastName → nullable ──────────────────────────
    console.log("1. Haciendo User.lastName nullable...");
    await sql('ALTER TABLE "User" ALTER COLUMN "lastName" DROP NOT NULL');
    console.log("   OK\n");

    // ── 2. User: travelsWithChildren + childrenAges ──────────
    console.log("2. Agregando columnas User: travelsWithChildren, childrenAges...");
    await sql('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "travelsWithChildren" BOOLEAN');
    await sql('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "childrenAges" TEXT');
    console.log("   OK\n");

    // ── 3. PlatformConfig: columnas pagomovil ────────────────
    console.log("3. Agregando columnas PlatformConfig pagomovil...");
    const pcCols = [
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilMode" TEXT NOT NULL DEFAULT \'MANUAL\'',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilPhone" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilBank" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilCedula" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilIdComercio" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilHmacSecret" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilAuthToken" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilAllowedIps" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilCreditoIdComercio" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilCreditoHmacSecret" TEXT',
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "pagomovilCreditoAuthToken" TEXT',
    ];
    for (const q of pcCols) {
      await sql(q);
    }
    console.log("   OK (" + pcCols.length + " columnas)\n");

    // ── 4. Crear tabla PagoMovilNotificacion ─────────────────
    console.log("4. Creando tabla PagoMovilNotificacion...");
    await sql(`
      CREATE TABLE IF NOT EXISTS "PagoMovilNotificacion" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "referencia" TEXT NOT NULL,
        "idComercio" TEXT,
        "telefonoComercio" TEXT,
        "telefonoEmisor" TEXT,
        "bancoEmisor" TEXT,
        "monto" DOUBLE PRECISION,
        "codigoRed" TEXT,
        "paymentId" TEXT,
        "abonado" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PagoMovilNotificacion_pkey" PRIMARY KEY ("id")
      )
    `);
    await sql('CREATE UNIQUE INDEX IF NOT EXISTS "PagoMovilNotificacion_referencia_key" ON "PagoMovilNotificacion"("referencia")');
    console.log("   OK\n");

    // ── 5. Crear tabla R4JsonLog ─────────────────────────────
    console.log("5. Creando tabla R4JsonLog...");
    await sql(`
      CREATE TABLE IF NOT EXISTS "R4JsonLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "tipo" TEXT NOT NULL,
        "rawPayload" TEXT NOT NULL,
        "clientIp" TEXT,
        "respuesta" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "R4JsonLog_pkey" PRIMARY KEY ("id")
      )
    `);
    console.log("   OK\n");

    console.log("=== Migración completada ===");
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
