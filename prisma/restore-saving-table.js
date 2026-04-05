const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Saving" (
      "id"             TEXT        NOT NULL,
      "userId"         TEXT        NOT NULL,
      "date"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "bcvRate"        DOUBLE PRECISION NOT NULL,
      "amountBs"       DOUBLE PRECISION NOT NULL,
      "amountUsd"      DOUBLE PRECISION NOT NULL,
      "paymentDetails" JSONB,
      "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Saving_pkey" PRIMARY KEY ("id")
    )
  `);
  console.log('Saving table created');

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Saving_userId_fkey'
      ) THEN
        ALTER TABLE "Saving"
          ADD CONSTRAINT "Saving_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$
  `);
  console.log('FK created');

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Saving_userId_idx" ON "Saving"("userId")
  `);
  console.log('Index created');

  console.log('Done');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
