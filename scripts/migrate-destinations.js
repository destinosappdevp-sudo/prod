// ============================================================
// SCRIPT DE MIGRACIÓN DE DATOS: Home → Destination
// ============================================================
// Ejecutar DESPUÉS de aplicar el SQL manual_add_destinations.sql
// Comando sugerido: npx dotenv-cli node scripts/migrate-destinations.js
// ============================================================

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function slugify(text) {
  if (!text) return "destino";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear().toString().slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function generateUniqueSlug(title, createdAt, existingSlugs) {
  const base = `${slugify(title)}-${formatDate(createdAt)}`;
  let slug = base;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${counter}`;
    counter++;
  }
  existingSlugs.add(slug);
  return slug;
}

async function main() {
  console.log("Iniciando migración de Home → Destination...");

  // 1. Obtener todos los Homes aprobados que aún no tienen destino
  const homes = await prisma.home.findMany({
    where: {
      publishStatus: "APPROVED",
      destinationId: null,
    },
  });

  console.log(`Se encontraron ${homes.length} paquetes aprobados para migrar.`);

  if (homes.length === 0) {
    console.log("No hay paquetes pendientes por migrar.");
    return;
  }

  // 2. Obtener slugs existentes para no duplicar
  const existingDestinations = await prisma.destination.findMany({
    select: { slug: true },
  });
  const existingSlugs = new Set(existingDestinations.map((d) => d.slug));

  // 3. Crear destinos y vincular hijos
  for (const home of homes) {
    const slug = await generateUniqueSlug(home.title, home.createdAt, existingSlugs);

    const destination = await prisma.destination.create({
      data: {
        title: home.title,
        subtitle: null,
        slug,
        description: home.description,
        photo: home.photo,
        country: home.country,
        municipality: home.municipality,
        exactAddress: home.exactAddress,
        contactNumber: home.contactNumber,
        categoryName: home.categoryName,
        propertyTypeId: home.propertyTypeId,
        latitude: home.latitude,
        longitude: home.longitude,
        price: home.price,
        priceVip: home.priceVip,
        vipSeats: home.vipSeats,
        standardSeats: home.standardSeats,
        checkInTime: home.checkInTime,
        publishStatus: "APPROVED",
        userId: home.userId,
      },
    });

    // 4. Vincular el Home como hijo del destination
    await prisma.home.update({
      where: { id: home.id },
      data: { destinationId: destination.id },
    });

    // 5. Migrar favoritos de este Home al Destination
    await prisma.favorite.updateMany({
      where: { homeId: home.id },
      data: {
        destinationId: destination.id,
        homeId: null,
      },
    });

    // 6. Migrar reviews de este Home al Destination
    await prisma.review.updateMany({
      where: { homeId: home.id },
      data: {
        destinationId: destination.id,
        homeId: null,
      },
    });

    console.log(`✓ Migrado: ${home.title} → ${destination.slug}`);
  }

  console.log("Migración completada.");
}

main()
  .catch((e) => {
    console.error("Error en la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
