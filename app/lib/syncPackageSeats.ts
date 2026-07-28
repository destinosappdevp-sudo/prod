/**
 * Sincroniza los PackageSeat de un paquete según el layout fijo del bus.
 *
 * Layout fijo (31 cupos vendibles):
 *   Chofer | Motor | Copiloto
 *   Fila 1: [1A][1B] [PASILLO] [1C][1D]    ← 4 asientos
 *   Fila 2: [2A][2B] [PASILLO] [2C][2D]    ← 4 asientos
 *   Fila 3: [3A][3B] [PASILLO] [3C][3D]    ← 4 asientos
 *   Fila 4: [4A][4B] [PASILLO] [4C][4D]    ← 4 asientos
 *   Fila 5: [5A][5B] [PASILLO] [5C][5D]    ← 4 asientos
 *   Fila 6: [6A][6B] [PASILLO] [6C][6D]    ← 4 asientos
 *   Fila 7: [7A][7B] [PASILLO] [7C][7D]    ← 4 asientos
 *   Fila 8: [8A][8B]   [8C]   [8D][8E]     ← 4 asientos (8C = copiloto, no se vende)
 *
 *   Total vendibles = 7×4 + 4 = 31
 *
 *   VIP = los primeros N asientos vendibles
 *   Estándar = el resto
 *
 * - Elimina los asientos AVAILABLE que ya no correspondan.
 * - Crea los nuevos asientos AVAILABLE.
 * - Los asientos OCCUPIED (ya reservados) nunca se eliminan.
 */

// Layout fijo del bus: cada fila define sus columnas vendibles
// La columna del chofer (row=0, col="A") y copiloto (row=8, col="C") NO se crean en la BD
const BUS_SELLABLE_LAYOUT: { row: number; columns: string[] }[] = [
  { row: 1, columns: ["A", "B", "C", "D"] },
  { row: 2, columns: ["A", "B", "C", "D"] },
  { row: 3, columns: ["A", "B", "C", "D"] },
  { row: 4, columns: ["A", "B", "C", "D"] },
  { row: 5, columns: ["A", "B", "C", "D"] },
  { row: 6, columns: ["A", "B", "C", "D"] },
  { row: 7, columns: ["A", "B", "C", "D"] },
  { row: 8, columns: ["A", "B", "D", "E"] }, // 8C es copiloto, no se vende
];

/** Total de cupos vendibles en el layout fijo */
export const TOTAL_SELLABLE_SEATS = 31;

export async function syncPackageSeats(
  tx: any,
  homeId: string,
  vipSeats: number,
  standardSeats: number
) {
  const packageSeatDelegate = tx?.packageSeat;
  if (
    !packageSeatDelegate ||
    typeof packageSeatDelegate.findMany !== "function" ||
    typeof packageSeatDelegate.deleteMany !== "function" ||
    typeof packageSeatDelegate.upsert !== "function"
  ) {
    console.warn(
      "syncPackageSeats omitido: delegate packageSeat no disponible en este entorno.",
      { homeId, vipSeats, standardSeats }
    );
    return;
  }

  // Clamp seat counts to valid ranges
  const totalDesired = vipSeats + standardSeats;
  const effectiveVipSeats = Math.min(vipSeats, TOTAL_SELLABLE_SEATS);
  const effectiveStandardSeats = Math.min(
    standardSeats,
    TOTAL_SELLABLE_SEATS - effectiveVipSeats
  );

  // Build the ordered list of sellable seats from the fixed layout
  const allSellableSeats: {
    zone: "VIP" | "STANDARD";
    row: number;
    column: string;
  }[] = [];

  let seatIndex = 0;
  for (const layoutRow of BUS_SELLABLE_LAYOUT) {
    for (const col of layoutRow.columns) {
      const zone: "VIP" | "STANDARD" =
        seatIndex < effectiveVipSeats ? "VIP" : "STANDARD";
      allSellableSeats.push({ zone, row: layoutRow.row, column: col });
      seatIndex++;
    }
  }

  // Only keep the desired seats
  const desiredSeats = allSellableSeats.slice(
    0,
    effectiveVipSeats + effectiveStandardSeats
  );

  // Obtener asientos OCCUPIED actuales (no se tocan)
  const occupiedSeats = await packageSeatDelegate.findMany({
    where: { homeId, status: "OCCUPIED" },
    select: { zone: true, row: true, column: true },
  });

  const occupiedKeys = new Set(
    occupiedSeats.map((s: any) => `${s.row}-${s.column}`)
  );

  // Eliminar todos los asientos AVAILABLE
  await packageSeatDelegate.deleteMany({
    where: { homeId, status: "AVAILABLE" },
  });

  // Crear los asientos deseados que no estén ya OCCUPIED
  for (const seat of desiredSeats) {
    const key = `${seat.row}-${seat.column}`;
    if (occupiedKeys.has(key)) continue;

    await packageSeatDelegate.upsert({
      where: {
        homeId_row_column: { homeId, row: seat.row, column: seat.column },
      },
      create: {
        id: crypto.randomUUID(),
        homeId,
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
  }
}
