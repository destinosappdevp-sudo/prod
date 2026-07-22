const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const homes = await p.home.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      country: true,
      municipality: true,
      publishStatus: true,
      checkInTime: true,
      createdAt: true,
      price: true,
      description: true,
      categoryName: true,
      userId: true,
    },
  });
  console.log(JSON.stringify(homes, null, 2));
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
