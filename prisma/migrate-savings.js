const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Saving" (
      "id"        TEXT NOT NULL,
      "userId"    TEXT NOT NULL,
      "date"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "bcvRate"   DOUBLE PRECISION NOT NULL,
      "amountBs"  DOUBLE PRECISION NOT NULL,
      "amountUsd" DOUBLE PRECISION NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Saving_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Saving_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "Saving_userId_idx" ON "Saving"("userId");
  `;

  console.log("Tabla Saving creada correctamente");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());



