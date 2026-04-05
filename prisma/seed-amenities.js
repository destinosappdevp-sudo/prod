// seed-amenities.js — inserta 3 grupos con sus servicios
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

// Base de Twemoji (SVG por código Unicode)
const tw = (code) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14/assets/svg/${code}.svg`;

const GROUPS = [
  {
    name: "Comidas",
    order: 1,
    amenities: [
      { name: "Desayunos",  iconKey: "desayunos",  iconUrl: tw("2615")   }, // ☕
      { name: "Almuerzos",  iconKey: "almuerzos",  iconUrl: tw("1f37d")  }, // 🍽
      { name: "Cenas",      iconKey: "cenas",       iconUrl: tw("1f377")  }, // 🍷
    ],
  },
  {
    name: "Traslados",
    order: 2,
    amenities: [
      { name: "Aeropuerto", iconKey: "aeropuerto", iconUrl: tw("2708")   }, // ✈️
      { name: "Lanchas",    iconKey: "lanchas",    iconUrl: tw("26f5")   }, // ⛵
      { name: "Carros",     iconKey: "carros",     iconUrl: tw("1f697")  }, // 🚗
    ],
  },
  {
    name: "Estancia",
    order: 3,
    amenities: [
      { name: "Hotel",              iconKey: "hotel",   iconUrl: tw("1f3e8") }, // 🏨
      { name: "Posada",             iconKey: "posada",  iconUrl: tw("1f3e1") }, // 🏡
      { name: "Aire acondicionado", iconKey: "aire",    iconUrl: tw("2744")  }, // ❄️
      { name: "Piscina",            iconKey: "piscina", iconUrl: tw("1f3ca") }, // 🏊
    ],
  },
];

async function main() {
  console.log("Insertando grupos y servicios...\n");

  for (const group of GROUPS) {
    const categoryId = randomUUID();
    await prisma.amenityCategory.create({
      data: {
        id: categoryId,
        name: group.name,
        order: group.order,
        isActive: true,
      },
    });

    console.log(`✓ Grupo: ${group.name} (${categoryId})`);

    for (const amenity of group.amenities) {
      await prisma.amenity.create({
        data: {
          id: randomUUID(),
          name: amenity.name,
          iconKey: amenity.iconKey,
          iconUrl: amenity.iconUrl,
          isActive: true,
          categoryId,
        },
      });
      console.log(`    └─ ${amenity.name}`);
    }
  }

  console.log("\n¡Listo! Grupos y servicios creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
