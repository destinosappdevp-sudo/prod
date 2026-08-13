const { PrismaClient } = require("@prisma/client");
const ENV_FILE = process.env.ENV_FILE || ".env";
require("dotenv").config({ path: ENV_FILE, override: true });

// Verifica que la conexión a la DB del entorno funciona tras rotar la password.
// Staging por defecto (.env). Para PROD: ENV_FILE=.env.local.
const DB_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

async function main() {
  if (!DB_URL) {
    console.error("Falta DIRECT_URL/DATABASE_URL en el archivo de entorno");
    process.exit(1);
  }
  const host = DB_URL.replace(/^.*@/, "");
  console.log("Target DB host:", host.split("/")[0]);

  const prisma = new PrismaClient({ datasources: { db: { url: DB_URL } } });
  try {
    const result = await prisma.$queryRawUnsafe(
      "SELECT 1 AS ok, current_database() AS db"
    );
    const row = result[0];
    const count = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*)::int AS total FROM \"User\""
    );
    console.log("Conexión OK:", JSON.stringify(row), "- Usuarios:", count[0].total);
  } catch (error) {
    console.error("Conexión FALLO:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
