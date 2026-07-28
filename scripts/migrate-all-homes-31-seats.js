/**
 * Migra TODOS los Homes de staging para tengan 31 asientos vendibles.
 *
 * Layout del bus:
 *   Filas 1-6: [A][B] PASILLO [C][D]  → 4 asientos c/u = 24
 *   Fila 7:    [A][B] PASILLO [PUERTA] → 2 asientos
 *   Fila 8:    [A][B] PASILLO [C][D][E] → 5 asientos
 *   Total = 31
 *
 * Para cada Home:
 *   1. Normaliza vipSeats + standardSeats = 31
 *   2. Borra los AVAILABLE existentes
 *   3. Crea los 31 PackageSeat con el layout correcto
 *   4. Respeta los OCCUPIED (no los toca)
 */

const { PrismaClient } = require("@prisma/client");

const STAGING_DB =
  "postgresql://postgres.hxdhkbiwhrroeffxyxfz:l8IPlvpvhKRN3BCK@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const TOTAL = 31;

const LAYOUT = [
  { row: 1, columns: ["A", "B", "C", "D"] },
  { row: 2, columns: ["A", "B", "C", "D"] },
  { row: 3, columns: ["A", "B", "C", "D"] },
  { row: 4, columns: ["A", "B", "C", "D"] },
  { row: 5, columns: ["A", "B", "C", "D"] },
  { row: 6, columns: ["A", "B", "C", "D"] },
  { row: 7, columns: ["A", "B"] },
  { row: 8, columns: ["A", "B", "C", "D", "E"] },
];

function buildSeatList(vipSeats, standardSeats) {
  const effectiveVip = Math.min(vipSeats, TOTAL);
  const effectiveStd = Math.min(standardSeats, TOTAL - effectiveVip);
  const seats = [];
  let idx = 0;
  for (const lr of LAYOUT) {
    for (const col of lr.columns) {
      if (idx >= effectiveVip + effectiveStd) break;
      seats.push({
        zone: idx < effectiveVip ? "VIP" : "STANDARD",
        row: lr.row,
        column: col,
      });
      idx++;
    }
  }
  return seats;
}

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: STAGING_DB } },
  });

  try {
    const homes = await prisma.home.findMany({
      select: {
        id: true,
        title: true,
        vipSeats: true,
        standardSeats: true,
        guests: true,
        bedrooms: true,
        bathrooms: true,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Encontrados ${homes.length} Homes en staging.\n`);

    let migrated = 0;
    let skipped = 0;

    for (const home of homes) {
      const currentTotal = (home.vipSeats || 0) + (home.standardSeats || 0);

      // Normalizar: mantener VIP si existe, el resto es Standard
      let newVip = home.vipSeats || 0;
      let newStd = TOTAL - newVip;

      // Si no tiene vipSeats, intentar inferir de bedrooms/bathrooms
      if (!home.vipSeats && !home.standardSeats) {
        const bed = parseInt(home.bedrooms) || 0;
        const bath = parseInt(home.bathrooms) || 0;
        if (bed + bath > 0) {
          newVip = Math.min(bed, TOTAL);
          newStd = TOTAL - newVip;
        } else {
          // Default: todo standard
          newVip = 0;
          newStd = TOTAL;
        }
      }

      if (newVip + newStd !== TOTAL) {
        newStd = TOTAL - newVip;
      }

      const desiredSeats = buildSeatList(newVip, newStd);

      try {
        await prisma.$transaction(async (tx) => {
          // Obtener asientos ocupados
          const occupied = await tx.packageSeat.findMany({
            where: { homeId: home.id, status: "OCCUPIED" },
            select: { row: true, column: true },
          });
          const occKeys = new Set(occupied.map((s) => `${s.row}-${s.column}`));

          // Borrar AVAILABLE existentes
          await tx.packageSeat.deleteMany({
            where: { homeId: home.id, status: "AVAILABLE" },
          });

          // Crear nuevos asientos
          let created = 0;
          for (const seat of desiredSeats) {
            const key = `${seat.row}-${seat.column}`;
            if (occKeys.has(key)) continue;

            await tx.packageSeat.upsert({
              where: {
                homeId_row_column: {
                  homeId: home.id,
                  row: seat.row,
                  column: seat.column,
                },
              },
              create: {
                id: crypto.randomUUID(),
                homeId: home.id,
                zone: seat.zone,
                row: seat.row,
                column: seat.column,
                status: "AVAILABLE",
              },
              update: {
                zone: seat.zone,
                status: "AVAILABLE",
              },
            });
            created++;
          }

          // Actualizar campos vipSeats/standardSeats/guests en Home
          await tx.home.update({
            where: { id: home.id },
            data: {
              vipSeats: newVip,
              standardSeats: newStd,
              guests: String(TOTAL),
            },
          });

          return { created, occCount: occupied.length };
        });

        const prevLabel =
          currentTotal > 0
            ? `VIP=${home.vipSeats || 0} STD=${home.standardSeats || 0} (total ${currentTotal})`
            : "sin asientos";
        console.log(
          `✓ ${home.title || home.id.slice(0, 8)} → VIP=${newVip} STD=${newStd} | ${prevLabel}`
        );
        migrated++;
      } catch (err) {
        console.error(`✗ ${home.title || home.id.slice(0, 8)}: ${err.message}`);
        skipped++;
      }
    }

    console.log(`\nMigración completada: ${migrated} ok, ${skipped} errores.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
