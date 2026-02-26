import prisma from "../app/lib/db";

async function main() {
  console.log("🌱 Inicializando amenidades...\n");

  // Limpiar amenidades existentes (opcional - comentar si quieres mantener datos)
  // await (prisma as any).homeAmenity.deleteMany({});
  // await (prisma as any).amenity.deleteMany({});
  // await (prisma as any).amenityCategory.deleteMany({});

  const categoriesData = [
    {
      name: "Baño",
      order: 1,
      amenities: [
        { name: "Agua caliente", iconKey: "droplets", iconUrl: null },
        { name: "Gel de ducha", iconKey: "soap", iconUrl: null },
      ],
    },
    {
      name: "Dormitorio y Lavadero",
      order: 2,
      amenities: [
        { name: "Lavadora en la vivienda", iconKey: "washer", iconUrl: null },
        { name: "Secadora en la vivienda", iconKey: "dryer", iconUrl: null },
        { name: "Ganchos para la ropa", iconKey: "coat-rack", iconUrl: null },
        { name: "Sábanas", iconKey: "bed", iconUrl: null },
        {
          name: "Almohadas y mantas adicionales",
          iconKey: "pillow",
          iconUrl: null,
        },
        { name: "Persianas o cortinas opacas", iconKey: "window-shade", iconUrl: null },
        { name: "Tendedero de ropa", iconKey: "clothesline", iconUrl: null },
        {
          name: "Espacio para guardar ropa",
          iconKey: "closet",
          iconUrl: null,
        },
      ],
    },
    {
      name: "Entretenimiento",
      order: 3,
      amenities: [
        { name: "TV", iconKey: "tv", iconUrl: null },
        { name: "Sistema de sonido", iconKey: "speaker", iconUrl: null },
        { name: "Equipo para hacer ejercicio", iconKey: "dumbbell", iconUrl: null },
      ],
    },
    {
      name: "Familia",
      order: 4,
      amenities: [
        {
          name: "Parque infantil al aire libre",
          iconKey: "play",
          iconUrl: null,
        },
      ],
    },
    {
      name: "Seguridad del Hogar",
      order: 5,
      amenities: [
        {
          name: "Cámaras de seguridad exterior",
          iconKey: "camera-security",
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
      order: 6,
      amenities: [
        { name: "WiFi", iconKey: "wifi", iconUrl: null },
        { name: "Zona de trabajo", iconKey: "briefcase", iconUrl: null },
      ],
    },
    {
      name: "Cocina",
      order: 7,
      amenities: [
        { name: "Cocina", iconKey: "chef-hat", iconUrl: null },
        { name: "Congelador", iconKey: "snowflake", iconUrl: null },
        {
          name: "Utensilios básicos para cocinar",
          iconKey: "utensils",
          iconUrl: null,
        },
        { name: "Ollas y sartenes", iconKey: "pot", iconUrl: null },
        { name: "Platos y cubiertos", iconKey: "spoon-fork", iconUrl: null },
        { name: "Bols y platos", iconKey: "bowl", iconUrl: null },
        { name: "Copas de vino", iconKey: "wine-glass", iconUrl: null },
        { name: "Cafetera", iconKey: "coffee", iconUrl: null },
        { name: "Licuadora", iconKey: "blender", iconUrl: null },
        { name: "Arrocera", iconKey: "rice-bowl", iconUrl: null },
        { name: "Compactador de basura", iconKey: "trash", iconUrl: null },
        { name: "Mesa del comedor", iconKey: "table-2", iconUrl: null },
      ],
    },
    {
      name: "Características de la Ubicación",
      order: 8,
      amenities: [
        {
          name: "Entrada independiente",
          iconKey: "door-open",
          iconUrl: null,
        },
        {
          name: "Lavandería cercana",
          iconKey: "washing-machine",
          iconUrl: null,
        },
      ],
    },
    {
      name: "Exterior",
      order: 9,
      amenities: [
        { name: "Patio o balcón", iconKey: "tree-palms", iconUrl: null },
      ],
    },
    {
      name: "Estacionamiento e Instalaciones",
      order: 10,
      amenities: [
        { name: "Ascensor", iconKey: "elevator", iconUrl: null },
        { name: "Gimnasio compartido", iconKey: "barbell", iconUrl: null },
      ],
    },
    {
      name: "Servicios",
      order: 11,
      amenities: [
        { name: "Se permiten mascotas", iconKey: "paw-print", iconUrl: null },
        {
          name: "Disponible para estadías largas",
          iconKey: "calendar",
          iconUrl: null,
        },
        { name: "Llegada autónoma", iconKey: "key", iconUrl: null },
        {
          name: "Servicio de limpieza disponible",
          iconKey: "sparkles",
          iconUrl: null,
        },
      ],
    },
    {
      name: "No Disponible",
      order: 12,
      amenities: [
        { name: "Aire acondicionado", iconKey: "air-vent", iconUrl: null },
        { name: "Servicios básicos", iconKey: "zap", iconUrl: null },
        { name: "Calefacción", iconKey: "fire", iconUrl: null },
      ],
    },
  ];

  const prismaAny = prisma as any;

  for (const categoryData of categoriesData) {
    console.log(`📦 Creando categoría: "${categoryData.name}"`);

    const category = await prismaAny.amenityCategory.create({
      data: {
        name: categoryData.name,
        order: categoryData.order,
        isActive: true,
      },
    });

    for (const amenityData of categoryData.amenities) {
      await prismaAny.amenity.create({
        data: {
          name: amenityData.name,
          iconKey: amenityData.iconKey,
          iconUrl: amenityData.iconUrl,
          isActive: true,
          categoryId: category.id,
        },
      });

      console.log(`  ✓ ${amenityData.name}`);
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
