const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("Borrando amenidades anteriores...");
  await prisma.homeAmenity.deleteMany({});
  await prisma.amenity.deleteMany({});
  await prisma.amenityCategory.deleteMany({});
  console.log("Limpieza completa\n");

  const categoriesData = [
    {
      name: "Alimentacion",
      order: 1,
      amenities: [
        { name: "Desayuno incluido",         iconKey: "coffee" },
        { name: "Almuerzo incluido",          iconKey: "utensils" },
        { name: "Cena incluida",              iconKey: "moon" },
        { name: "Todo incluido",              iconKey: "star" },
        { name: "Merienda / Snacks",          iconKey: "package" },
      ],
    },
    {
      name: "Alojamiento",
      order: 2,
      amenities: [
        { name: "Hotel incluido",             iconKey: "building-2" },
        { name: "Posada incluida",            iconKey: "home" },
        { name: "Cabana incluida",            iconKey: "trees" },
        { name: "Resort incluido",            iconKey: "building" },
      ],
    },
    {
      name: "Transporte",
      order: 3,
      amenities: [
        { name: "Traslado aeropuerto",        iconKey: "plane" },
        { name: "Transporte terrestre",       iconKey: "bus" },
        { name: "Transporte privado",         iconKey: "car" },
        { name: "Paseo en lancha",            iconKey: "ship" },
        { name: "Paseo en bote o velero",     iconKey: "anchor" },
      ],
    },
    {
      name: "Actividades y Excursiones",
      order: 4,
      amenities: [
        { name: "Snorkel incluido",           iconKey: "waves" },
        { name: "Buceo incluido",             iconKey: "droplets" },
        { name: "Senderismo guiado",          iconKey: "map-pin" },
        { name: "Tour de ciudad",             iconKey: "map" },
        { name: "Visita a parques naturales", iconKey: "trees" },
        { name: "Paseo en kayak",             iconKey: "rows" },
        { name: "Avistamiento de fauna",      iconKey: "binoculars" },
      ],
    },
    {
      name: "Guia y Servicio",
      order: 5,
      amenities: [
        { name: "Guia turistico incluido",    iconKey: "user-check" },
        { name: "Guia bilingue",              iconKey: "languages" },
        { name: "Coordinador de grupo",       iconKey: "users" },
      ],
    },
    {
      name: "Equipamiento",
      order: 6,
      amenities: [
        { name: "Equipo de snorkel",          iconKey: "glasses" },
        { name: "Equipo de buceo",            iconKey: "shield" },
        { name: "Salvavidas / Chaleco",       iconKey: "life-buoy" },
        { name: "Mochila de senderismo",      iconKey: "backpack" },
      ],
    },
  ];

  for (const cat of categoriesData) {
    console.log("Categoria: " + cat.name);
    const category = await prisma.amenityCategory.create({
      data: { id: randomUUID(), name: cat.name, order: cat.order, isActive: true },
    });
    for (const am of cat.amenities) {
      await prisma.amenity.create({
        data: { id: randomUUID(), name: am.name, iconKey: am.iconKey, iconUrl: null, isActive: true, categoryId: category.id },
      });
      console.log("  + " + am.name);
    }
    console.log("");
  }

  const total = categoriesData.reduce(function(s, c) { return s + c.amenities.length; }, 0);
  console.log("Listo: " + categoriesData.length + " categorias, " + total + " amenidades");
}

main()
  .then(function() { return prisma.$disconnect(); })
  .catch(function(e) { console.error(e.message); process.exit(1); });



