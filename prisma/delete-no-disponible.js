const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.amenityCategory.deleteMany({
    where: { name: "No Disponible" },
  });
  console.log(`Eliminadas ${deleted.count} categorías "No Disponible"`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
