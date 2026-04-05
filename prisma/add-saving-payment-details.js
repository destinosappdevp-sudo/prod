const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Saving" ADD COLUMN IF NOT EXISTS "paymentDetails" JSONB');
  console.log('paymentDetails column added to Saving');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
