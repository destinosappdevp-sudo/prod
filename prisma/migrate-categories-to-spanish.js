const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categoryMapping = {
  // Migración original inglés → español
  trending: "vuelos",
  beach: "playa",
  apartment: "apartamento",
  luxe: "lujo",
  amazingView: "vistasIncreibles",
  design: "habitacion",
  mountains: "glamping",
  tiny: "casaPequena",
  historic: "casaCompleta",
  cabin: "cabana",
  countryside: "casaDeCampo",
  omg: "espectacular",
  // Renombres internos en español
  tendencia: "vuelos",
  diseno: "habitacion",
  losAndes: "glamping",
  casaHistorica: "casaCompleta",
};

async function main() {
  console.log("Iniciando migración de categorías a español...\n");

  let totalUpdated = 0;

  for (const [oldName, newName] of Object.entries(categoryMapping)) {
    const result = await prisma.home.updateMany({
      where: { categoryName: oldName },
      data: { categoryName: newName },
    });
    if (result.count > 0) {
      console.log(`  ✓ "${oldName}" → "${newName}" (${result.count} registros)`);
      totalUpdated += result.count;
    }
  }

  console.log(`\nMigración completa. Total actualizados: ${totalUpdated} registros.`);
}

main()
  .catch((e) => {
    console.error("Error en migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
