const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const categories = [
  { name: 'Playas',       icon: '🏖️' },
  { name: 'Islas',        icon: '🏝️' },
  { name: 'Montañas',     icon: '⛰️' },
  { name: 'Aventura',     icon: '🚀' },
];

async function main() {
  for (const cat of categories) {
    const existing = await p.property_types.findFirst({ where: { name: cat.name } });
    if (!existing) {
      await p.property_types.create({ data: { name: cat.name, icon: cat.icon } });
      console.log(`+ ${cat.icon} ${cat.name}`);
    } else {
      await p.property_types.update({ where: { id: existing.id }, data: { icon: cat.icon } });
      console.log(`= ${cat.icon} ${cat.name} (ya existía, icon actualizado)`);
    }
  }
  const all = await p.property_types.findMany({ orderBy: { id: 'asc' } });
  console.log('\nCategorías en BD:', all.map(c => `${c.icon} ${c.name}`).join(', '));
  await p.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });



