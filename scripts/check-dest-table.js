const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function main() {
  const result = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'Destination'
    ORDER BY ordinal_position
  `);
  console.log("Destination columns:");
  for (const row of result) {
    console.log(`  ${row.column_name} (${row.data_type}) nullable=${row.is_nullable}`);
  }
  if (result.length === 0) console.log("  Table does not exist");
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
