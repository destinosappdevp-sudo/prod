const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const total = await p.home.count();
  const approved = await p.home.count({ where: { publishStatus: "APPROVED" } });
  const withDest = await p.home.count({ where: { destinationId: { not: null } } });
  const statuses = await p.home.groupBy({ by: ["publishStatus"], _count: true });
  const destCount = await p.destination.count();
  const dests = await p.destination.findMany({ select: { id: true, title: true, slug: true } });
  console.log("Total Homes:", total);
  console.log("Approved:", approved);
  console.log("With destinationId:", withDest);
  console.log("By status:", JSON.stringify(statuses, null, 2));
  console.log("Destinations:", destCount);
  console.log("Dest list:", JSON.stringify(dests, null, 2));
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
