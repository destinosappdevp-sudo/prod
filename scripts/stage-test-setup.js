const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const homes = await p.home.findMany({ take: 3, orderBy: { createdAt: "desc" } });
  for (const h of homes) {
    await p.home.update({ where: { id: h.id }, data: { publishStatus: "APPROVED" } });
    console.log(`→ ${h.title} (${h.id}) set to APPROVED`);
  }
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
