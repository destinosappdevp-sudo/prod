const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  // Restore Home.slug (dropped by accidental DB reset)
  await p.$executeRawUnsafe(`ALTER TABLE "Home" ADD COLUMN IF NOT EXISTS "slug" TEXT`);
  console.log('Home.slug column added');

  await p.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'Home' AND indexname = 'Home_slug_key'
      ) THEN
        CREATE UNIQUE INDEX "Home_slug_key" ON "Home"("slug");
      END IF;
    END $$
  `);
  console.log('Home.slug unique index created');

  // Backfill slugs for homes that don't have one
  const homes = await p.$queryRawUnsafe(`SELECT id, title FROM "Home" WHERE slug IS NULL`);
  console.log(`Homes needing slug backfill: ${homes.length}`);

  let updated = 0;
  for (const home of homes) {
    const base = (home.title || home.id)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
    const slug = base + '-' + home.id.replace(/-/g, '').slice(0, 8);
    try {
      await p.$executeRawUnsafe(`UPDATE "Home" SET "slug" = $1 WHERE "id" = $2`, slug, home.id);
      updated++;
    } catch(e) {
      // Collision: add extra suffix
      const fallback = base + '-' + home.id.replace(/-/g, '').slice(0, 12);
      await p.$executeRawUnsafe(`UPDATE "Home" SET "slug" = $1 WHERE "id" = $2`, fallback, home.id);
      updated++;
    }
  }
  console.log(`Slugs backfilled: ${updated}`);

  await p.$disconnect();
  console.log('Done');
}
main().catch(e => { console.error(e.message); process.exit(1); });
