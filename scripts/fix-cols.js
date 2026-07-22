const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  await p.$executeRawUnsafe('ALTER TABLE "Destination" RENAME COLUMN "exactaddress" TO "exactAddress"');
  await p.$executeRawUnsafe('ALTER TABLE "Destination" RENAME COLUMN "contactnumber" TO "contactNumber"');
  console.log("Columnas renombradas correctamente");
  await p.$disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
