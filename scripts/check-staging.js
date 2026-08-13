const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

// Apunta a STAGING (.env). Usa DIRECT_URL para evitar el pooler en consultas de inspección.
const STAGING_DB = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: STAGING_DB } },
  });

  try {
    // 1. All tables
    const tables = await prisma.$queryRawUnsafe(
      "SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name"
    );
    console.log("=== All Tables ===");
    for (const t of tables) console.log(" ", t.table_name);

    // 2. PlatformConfig full row
    const pc = await prisma.$queryRawUnsafe('SELECT * FROM "PlatformConfig" LIMIT 1');
    console.log("\n=== PlatformConfig Full Row ===");
    console.log(JSON.stringify(pc[0], null, 2));

    // 3. pagoMovilNotificacion
    try {
      const pmn = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as total FROM "pagoMovilNotificacion"');
      console.log("\npagoMovilNotificacion count:", pmn[0].total);
    } catch (e) {
      console.log("\npagoMovilNotificacion:", e.message);
    }

    // 4. r4JsonLog
    try {
      const r4 = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int as total FROM "r4JsonLog"');
      console.log("r4JsonLog count:", r4[0].total);
    } catch (e) {
      console.log("r4JsonLog:", e.message);
    }

    // 5. Payment columns
    const payCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'Payment' ORDER BY ordinal_position"
    );
    console.log("\n=== Payment Columns ===");
    console.log(payCols.map((c) => c.column_name).join(", "));

    // 6. Reservation columns
    const resCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'Reservation' ORDER BY ordinal_position"
    );
    console.log("\n=== Reservation Columns ===");
    console.log(resCols.map((c) => c.column_name).join(", "));

    // 7. Home columns
    const homeCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'Home' ORDER BY ordinal_position"
    );
    console.log("\n=== Home Columns ===");
    console.log(homeCols.map((c) => c.column_name).join(", "));

    // 8. Check NOT NULL constraints on User.lastName
    const lnConstraints = await prisma.$queryRawUnsafe(
      "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastName'"
    );
    console.log("\n=== User.lastName nullable? ===");
    console.log(JSON.stringify(lnConstraints));

    // 9. Missing columns in PlatformConfig
    const pcCols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'PlatformConfig' ORDER BY ordinal_position"
    );
    console.log("\n=== PlatformConfig Columns ===");
    console.log(pcCols.map((c) => c.column_name).join(", "));
    
    // Expected pagomovil columns
    const expectedPC = ['pagomovilMode','pagomovilPhone','pagomovilBank','pagomovilCedula','pagomovilIdComercio','pagomovilHmacSecret','pagomovilAuthToken','pagomovilAllowedIps','pagomovilCreditoIdComercio','pagomovilCreditoHmacSecret','pagomovilCreditoAuthToken'];
    const pcColSet = new Set(pcCols.map(c => c.column_name));
    console.log("\n=== Missing PlatformConfig Columns ===");
    for (const c of expectedPC) {
      if (!pcColSet.has(c)) console.log("  MISSING:", c);
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
