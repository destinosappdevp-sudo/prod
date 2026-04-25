const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const userCols = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' ORDER BY ordinal_position`;
  console.log('User cols:', userCols.map(c => c.column_name).join(', '));

  const homeCols = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Home' ORDER BY ordinal_position`;
  console.log('Home cols:', homeCols.map(c => c.column_name).join(', '));

  const reservationCols = await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Reservation' ORDER BY ordinal_position`;
  console.log('Reservation cols:', reservationCols.map(c => c.column_name).join(', '));

  // Check enums
  const enums = await p.$queryRaw`SELECT typname, enumlabel FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid ORDER BY typname, enumsortorder`;
  const enumMap = {};
  for (const e of enums) {
    if (!enumMap[e.typname]) enumMap[e.typname] = [];
    enumMap[e.typname].push(e.enumlabel);
  }
  console.log('Enums:', JSON.stringify(enumMap, null, 2));

  await p.$disconnect();
}
main().catch(console.error);
