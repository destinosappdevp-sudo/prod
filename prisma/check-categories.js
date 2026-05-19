const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const grupos = await prisma.home.groupBy({
    by: ["categoryName"],
    _count: { categoryName: true },
    orderBy: { _count: { categoryName: "desc" } },
  });

  console.log("\nCategorías en BD:\n");
  grupos.forEach((g) => {
    console.log(`  "${g.categoryName}" → ${g._count.categoryName} propiedad(es)`);
  });
  console.log(`\nTotal categorías distintas: ${grupos.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());



