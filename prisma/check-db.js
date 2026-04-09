const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  try {
    await p.$queryRawUnsafe('SELECT id FROM "Saving" LIMIT 1');
    console.log('Saving OK');
  } catch(e) { console.log('Saving ERROR:', e.message); }
  try {
    await p.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'Saving\' ORDER BY ordinal_position');
    const cols = await p.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'Saving\' ORDER BY ordinal_position');
    console.log('Saving columns:', JSON.stringify(cols));
  } catch(e) { console.log('Saving columns ERROR:', e.message); }
  try {
    await p.$queryRawUnsafe('SELECT id FROM "User" LIMIT 1');
    console.log('User OK');
  } catch(e) { console.log('User ERROR:', e.message); }
  try {
    await p.$queryRawUnsafe('SELECT "bcvRate" FROM "PlatformConfig" LIMIT 1');
    console.log('PlatformConfig OK');
  } catch(e) { console.log('PlatformConfig ERROR:', e.message); }
  try {
    await p.$queryRawUnsafe('SELECT column_name FROM information_schema.columns WHERE table_name = \'Home\' AND column_name = \'slug\'');
    console.log('Home.slug column exists');
  } catch(e) { console.log('Home.slug ERROR:', e.message); }
  await p.$disconnect();
}
main().catch(console.error);
