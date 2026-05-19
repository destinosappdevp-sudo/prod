/**
 * Backfill: genera slugs para todos los Home que no tengan slug aún
 * Ejecutar: node prisma/backfill-slugs.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function generateSlug(title, id) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base}-${id.slice(0, 6)}`;
}

async function run() {
  const homes = await prisma.$queryRaw`
    SELECT id, title FROM "Home" WHERE slug IS NULL AND title IS NOT NULL
  `;

  console.log(`Backfilling ${homes.length} homes...`);

  let updated = 0;
  for (const home of homes) {
    const slug = generateSlug(home.title, home.id);
    try {
      await prisma.$executeRaw`UPDATE "Home" SET slug = ${slug} WHERE id = ${home.id}`;
      updated++;
    } catch (e) {
      // Slug collision (very unlikely) — append more chars
      const fallback = `${slug}-${home.id.slice(6, 10)}`;
      try {
        await prisma.$executeRaw`UPDATE "Home" SET slug = ${fallback} WHERE id = ${home.id}`;
        updated++;
      } catch (e2) {
        console.warn(`Could not set slug for ${home.id}: ${e2.message}`);
      }
    }
  }

  console.log(`Done. Updated ${updated}/${homes.length} homes.`);
  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e.message);
  await prisma.$disconnect();
  process.exit(1);
});



