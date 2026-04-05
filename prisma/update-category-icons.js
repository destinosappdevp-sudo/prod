// update-category-icons.js — actualiza las categorías con íconos Twemoji
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const tw = (code) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/${code}.svg`;

const ICONS = [
  { id: 1, name: "Playas",    icon: tw("1f3d6") }, // 🏖️
  { id: 2, name: "Islas",     icon: tw("1f3dd") }, // 🏝️
  { id: 3, name: "Montañas",  icon: tw("1f3d4") }, // 🏔️
  { id: 4, name: "Aventura",  icon: tw("1f9d7") }, // 🧗
];

async function main() {
  for (const item of ICONS) {
    await prisma.property_types.update({
      where: { id: item.id },
      data: { icon: item.icon },
    });
    console.log(`✓ ${item.name} → icono actualizado`);
  }
  console.log("\n¡Listo!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
