const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRaw`ALTER TABLE "Home" ADD COLUMN IF NOT EXISTS "slug" TEXT`;
  console.log("Column added");
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Home_slug_key" ON "Home"("slug")`;
  console.log("Index created");
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});



