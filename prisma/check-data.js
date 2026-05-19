const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const homes    = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Home"`;
  const users    = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "User"`;
  const reserv   = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Reservation"`;
  const payments = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Payment"`;
  const reviews  = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Review"`;
  const favs     = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "Favorite"`;
  const configs  = await p.$queryRaw`SELECT COUNT(*) as cnt FROM "PlatformConfig"`;
  console.log('Home:', homes[0].cnt);
  console.log('User:', users[0].cnt);
  console.log('Reservation:', reserv[0].cnt);
  console.log('Payment:', payments[0].cnt);
  console.log('Review:', reviews[0].cnt);
  console.log('Favorite:', favs[0].cnt);
  console.log('PlatformConfig:', configs[0].cnt);
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });



