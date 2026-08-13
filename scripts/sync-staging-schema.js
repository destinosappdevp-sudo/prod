/**
 * Migración final de staging (hxdhkbiwhrroeffxyxfz) para sincronizar con schema Prisma.
 *
 * Ejecutar: node scripts/sync-staging-schema.js
 *
 * CAMBIOS:
 * 1. User: elimina columna legacy lastName
 * 2. Destination: agrega updatedAt
 * 3. PaymentMethod enum: agrega BINANCE, ZINLI
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
    console.log("=== Sync Staging Schema ===\n");

    // 1. User: drop legacy lastName column
    console.log("1. Eliminando User.lastName (legacy)...");
    try {
      await sql('ALTER TABLE "User" DROP COLUMN "lastName"');
      console.log("   OK\n");
    } catch (e) {
      if (e.message.includes("does not exist")) {
        console.log("   Ya no existe, OK\n");
      } else {
        throw e;
      }
    }

    // 2. Destination: add updatedAt
    console.log("2. Agregando Destination.updatedAt...");
    try {
      await sql('ALTER TABLE "Destination" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP');
      console.log("   OK\n");
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log("   Ya existe, OK\n");
      } else {
        throw e;
      }
    }

    // 3. PaymentMethod enum: add BINANCE, ZINLI
    console.log("3. Agregando enum values BINANCE, ZINLI...");
    try {
      await sql("ALTER TYPE \"PaymentMethod\" ADD VALUE IF NOT EXISTS 'BINANCE'");
      console.log("   BINANCE OK");
    } catch (e) {
      console.log("   BINANCE:", e.message.includes("already exists") ? "ya existe" : e.message);
    }
    try {
      await sql("ALTER TYPE \"PaymentMethod\" ADD VALUE IF NOT EXISTS 'ZINLI'");
      console.log("   ZINLI OK\n");
    } catch (e) {
      console.log("   ZINLI:", e.message.includes("already exists") ? "ya existe" : e.message);
    }

    // Verify
    console.log("=== Verificación ===");
    const userCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position"
    );
    console.log("User columns:", userCols.map((c) => c.column_name).join(", "));

    const destCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'Destination' ORDER BY ordinal_position"
    );
    console.log("Destination columns:", destCols.map((c) => c.column_name).join(", "));

    const pmEnum = await prisma.$queryRawUnsafe(
      "SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'PaymentMethod' ORDER BY e.enumsortorder"
    );
    console.log("PaymentMethod enum:", pmEnum.map((e) => e.enumlabel).join(", "));

    console.log("\n=== Migración completada ===");
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
