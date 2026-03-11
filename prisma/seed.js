const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inicializando amenidades...\n");

  const categoriesData = [
    {
      name: "Vistas panorámicas",
      order: 1,
      amenities: [
        { name: "Vista al horizonte de la ciudad", iconKey: "city", iconUrl: null },
        { name: "Vista a la playa", iconKey: "waves", iconUrl: null },
      ],
    },
    {
      name: "Baño",
      order: 2,
      amenities: [
        { name: "Tina", iconKey: "bath", iconUrl: null },
        { name: "Agua caliente", iconKey: "droplets", iconUrl: null },
      ],
    },
    {
      name: "Dormitorio y lavadero",
      order: 3,
      amenities: [
        { name: "Lavadora", iconKey: "washer", iconUrl: null },
        { name: "Secadora", iconKey: "dryer", iconUrl: null },
      ],
    },
    {
      name: "Servicios básicos",
      order: 4,
      amenities: [
        {
          name: "Toallas, sábanas, jabón y papel higiénico",
          iconKey: "package",
          iconUrl: null,
        },
        { name: "Ganchos para la ropa", iconKey: "coat-rack", iconUrl: null },
      ],
    },
    {
      name: "Entretenimiento",
      order: 5,
      amenities: [
        { name: "Televisor con cable estándar", iconKey: "tv", iconUrl: null },
      ],
    },
    {
      name: "Calefacción y refrigeración",
      order: 6,
      amenities: [
        { name: "Aire acondicionado", iconKey: "air-vent", iconUrl: null },
      ],
    },
    {
      name: "Seguridad en el hogar",
      order: 7,
      amenities: [
        {
          name: "Cámaras de seguridad en la parte exterior de la propiedad",
          iconKey: "camera-security",
          iconUrl: null,
        },
        {
          name: "Monitorea zona de vehículos y zona de ascensores",
          iconKey: "cctv",
          iconUrl: null,
        },
        {
          name: "Detector de humo",
          iconKey: "smoke-detector",
          iconUrl: null,
        },
        {
          name: "Detector de monóxido de carbono",
          iconKey: "alert-circle",
          iconUrl: null,
        },
      ],
    },
    {
      name: "Internet y Oficina",
      order: 8,
      amenities: [
        { name: "Wifi", iconKey: "wifi", iconUrl: null },
      ],
    },
    {
      name: "Utensilios y vajilla",
      order: 9,
      amenities: [
        { name: "Cocina", iconKey: "chef-hat", iconUrl: null },
        {
          name: "Los huéspedes pueden cocinar en este espacio",
          iconKey: "info",
          iconUrl: null,
        },
        { name: "Refrigerador", iconKey: "refrigerator", iconUrl: null },
        {
          name: "Utensilios básicos para cocinar",
          iconKey: "utensils",
          iconUrl: null,
        },
        {
          name: "Ollas y sartenes, aceite, sal y pimienta",
          iconKey: "pot",
          iconUrl: null,
        },
        { name: "Platos y cubiertos", iconKey: "spoon-fork", iconUrl: null },
        {
          name: "Bols, palitos chinos, platos, tazas, etc.",
          iconKey: "bowl",
          iconUrl: null,
        },
        { name: "Horno", iconKey: "oven", iconUrl: null },
        { name: "Cafetera", iconKey: "coffee", iconUrl: null },
      ],
    },
    {
      name: "Características de la Ubicación",
      order: 10,
      amenities: [
        { name: "Litoral", iconKey: "map-pin", iconUrl: null },
        {
          name: "Acceso a la playa - Frente a la playa",
          iconKey: "umbrella",
          iconUrl: null,
        },
        {
          name: "Los huéspedes pueden disfrutar de una playa cercana",
          iconKey: "waves",
          iconUrl: null,
        },
        {
          name: "Acceso al complejo turístico",
          iconKey: "building-2",
          iconUrl: null,
        },
        {
          name: "Los huéspedes pueden usar las instalaciones de resort cercanas",
          iconKey: "building",
          iconUrl: null,
        },
      ],
    },
    {
      name: "Exterior",
      order: 11,
      amenities: [
        { name: "Patio o balcón privado", iconKey: "tree-palms", iconUrl: null },
        { name: "Patio trasero", iconKey: "trees", iconUrl: null },
        {
          name: "Un espacio abierto en la propiedad generalmente cubierto de pasto",
          iconKey: "leaf",
          iconUrl: null,
        },
        { name: "Zona de comida al aire libre", iconKey: "utensils", iconUrl: null },
        { name: "Parrilla", iconKey: "grill", iconUrl: null },
      ],
    },
    {
      name: "Estacionamiento e Instalaciones",
      order: 12,
      amenities: [
        {
          name: "Estacionamiento gratuito en las instalaciones",
          iconKey: "car",
          iconUrl: null,
        },
        { name: "Piscina compartida", iconKey: "waves", iconUrl: null },
        { name: "Jacuzzi compartido", iconKey: "bath", iconUrl: null },
        { name: "Ascensor", iconKey: "elevator", iconUrl: null },
      ],
    },
    {
      name: "Servicios",
      order: 13,
      amenities: [
        { name: "Apto para fumadores", iconKey: "cigarette", iconUrl: null },
      ],
    },
    {
      name: "No incluidos",
      order: 14,
      amenities: [
        { name: "Calefacción", iconKey: "fire", iconUrl: null },
      ],
    },
  ];

  for (const categoryData of categoriesData) {
    console.log(`📦 Sincronizando categoría: "${categoryData.name}"`);

    let category = await prisma.amenityCategory.findFirst({
      where: { name: categoryData.name },
      orderBy: { createdAt: "asc" },
    });

    if (!category) {
      category = await prisma.amenityCategory.create({
        data: {
          id: randomUUID(),
          name: categoryData.name,
          order: categoryData.order,
          isActive: true,
        },
      });
      console.log("  + categoría creada");
    } else {
      await prisma.amenityCategory.update({
        where: { id: category.id },
        data: {
          order: categoryData.order,
          isActive: true,
        },
      });
      console.log("  = categoría existente actualizada");
    }

    for (const amenityData of categoryData.amenities) {
      const existingAmenity = await prisma.amenity.findFirst({
        where: {
          name: amenityData.name,
          categoryId: category.id,
        },
        orderBy: { createdAt: "asc" },
      });

      if (!existingAmenity) {
        await prisma.amenity.create({
          data: {
            id: randomUUID(),
            name: amenityData.name,
            iconKey: amenityData.iconKey,
            iconUrl: amenityData.iconUrl,
            isActive: true,
            categoryId: category.id,
          },
        });
        console.log(`  + ${amenityData.name}`);
      } else {
        await prisma.amenity.update({
          where: { id: existingAmenity.id },
          data: {
            iconKey: amenityData.iconKey,
            iconUrl: amenityData.iconUrl,
            isActive: true,
            categoryId: category.id,
          },
        });
        console.log(`  = ${amenityData.name}`);
      }
    }

    console.log("");
  }

  console.log("✨ ¡Amenidades inicializadas exitosamente!");
  console.log(
    `Total de categorías: ${categoriesData.length}`
  );
  console.log(
    `Total de amenidades: ${categoriesData.reduce((sum, cat) => sum + cat.amenities.length, 0)}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error al inicializar amenidades:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
