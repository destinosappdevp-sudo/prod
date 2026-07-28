/**
 * Sincroniza los PackageSeat de un paquete según el tipo de transporte.
 *
 * Layouts disponibles:
 *
 * ENC32 (Encava 32) - 31 cupos vendibles + 1 copiloto:
 *   [CHOFER] [MOTOR] [GUÍA TURÍSTICO] → [PUERTA DELANTERA]
 *   Fila 1: [1A][1B] [PASILLO] [1C][1D]    ← 4 asientos
 *   Fila 2: [2A][2B] [PASILLO] [2C][2D]    ← 4 asientos
 *   Fila 3: [3A][3B] [PASILLO] [3C][3D]    ← 4 asientos
 *   Fila 4: [4A][4B] [PASILLO] [4C][4D]    ← 4 asientos
 *   Fila 5: [5A][5B] [PASILLO] [5C][5D]    ← 4 asientos
 *   Fila 6: [6A][6B] [PASILLO] [6C][6D]    ← 4 asientos
 *   Fila 7: [7A][7B] [PASILLO] [PUERTA]    ← 2 asientos (7C, 7D = puerta trasera)
 *   Fila 8: [8A][8B] [8C] [8D][8E]         ← 5 asientos
 *   Total vendibles = 6×4 + 2 + 5 = 31
 *
 * VAN20 (Van 20) - 19 cupos vendibles + 1 copiloto:
 *   [CHOFER] [COPILOTO]
 *   Fila 1: [1A][1B][1C]    ← 3 asientos
 *   Fila 2: [2A][2B][2C]    ← 3 asientos
 *   Fila 3: [3A][3B][3C]    ← 3 asientos
 *   Fila 4: [4A][4B][4C]    ← 3 asientos
 *   Fila 5: [5A][5B][5C]    ← 3 asientos
 *   Fila 6: [6A][6B][6C][6D] ← 4 asientos
 *   Total vendibles = 5×3 + 4 = 19
 *
 * VAN20_PASILLO (Van 20 Pasillo) - 19 cupos vendibles + 1 copiloto:
 *   [CHOFER] [COPILOTO]
 *   Fila 1: [1A][1B] [PASILLO] [1C]  ← 3 asientos (2 izq + 1 der)
 *   Fila 2: [2A][2B] [PASILLO] [2C]  ← 3 asientos
 *   Fila 3: [3A][3B] [PASILLO] [3C]  ← 3 asientos
 *   Fila 4: [4A][4B] [PASILLO] [4C]  ← 3 asientos
 *   Fila 5: [5A][5B] [PASILLO] [5C]  ← 3 asientos
 *   Fila 6: [6A][6B][6C][6D]         ← 4 asientos
 *   Total vendibles = 5×3 + 4 = 19
 *
 *   VIP = los primeros N asientos vendibles, Estándar = el resto
 */

type TransportType = "ENC32" | "VAN20" | "VAN20_PASILLO";

const LAYOUTS: Record<TransportType, { row: number; columns: string[] }[]> = {
  ENC32: [
    { row: 1, columns: ["A", "B", "C", "D"] },
    { row: 2, columns: ["A", "B", "C", "D"] },
    { row: 3, columns: ["A", "B", "C", "D"] },
    { row: 4, columns: ["A", "B", "C", "D"] },
    { row: 5, columns: ["A", "B", "C", "D"] },
    { row: 6, columns: ["A", "B", "C", "D"] },
    { row: 7, columns: ["A", "B"] },
    { row: 8, columns: ["A", "B", "C", "D", "E"] },
  ],
  VAN20: [
    { row: 1, columns: ["A", "B", "C"] },
    { row: 2, columns: ["A", "B", "C"] },
    { row: 3, columns: ["A", "B", "C"] },
    { row: 4, columns: ["A", "B", "C"] },
    { row: 5, columns: ["A", "B", "C"] },
    { row: 6, columns: ["A", "B", "C", "D"] },
  ],
  VAN20_PASILLO: [
    { row: 1, columns: ["A", "B", "C"] },
    { row: 2, columns: ["A", "B", "C"] },
    { row: 3, columns: ["A", "B", "C"] },
    { row: 4, columns: ["A", "B", "C"] },
    { row: 5, columns: ["A", "B", "C"] },
    { row: 6, columns: ["A", "B", "C", "D"] },
  ],
};

const TOTAL_SELLABLE_BY_TRANSPORT: Record<TransportType, number> = {
  ENC32: 31,
  VAN20: 19,
  VAN20_PASILLO: 19,
};

export async function syncPackageSeats(
  tx: any,
  homeId: string,
  vipSeats: number,
  standardSeats: number,
  transportType: TransportType = "ENC32"
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
      { homeId, vipSeats, standardSeats, transportType }
    );
    return;
  }

  const totalSellable = TOTAL_SELLABLE_BY_TRANSPORT[transportType];
  const effectiveVipSeats = Math.min(vipSeats, totalSellable);
  const effectiveStandardSeats = Math.min(
    standardSeats,
    totalSellable - effectiveVipSeats
  );

  const layout = LAYOUTS[transportType];

  const allSellableSeats: {
    zone: "VIP" | "STANDARD";
    row: number;
    column: string;
  }[] = [];

  let seatIndex = 0;
  for (const layoutRow of layout) {
    for (const col of layoutRow.columns) {
      const zone: "VIP" | "STANDARD" =
        seatIndex < effectiveVipSeats ? "VIP" : "STANDARD";
      allSellableSeats.push({ zone, row: layoutRow.row, column: col });
      seatIndex++;
    }
  }

  const desiredSeats = allSellableSeats.slice(
    0,
    effectiveVipSeats + effectiveStandardSeats
  );

  const occupiedSeats = await packageSeatDelegate.findMany({
    where: { homeId, status: "OCCUPIED" },
    select: { zone: true, row: true, column: true },
  });

  const occupiedKeys = new Set(
    occupiedSeats.map((s: any) => `${s.row}-${s.column}`)
  );

  await packageSeatDelegate.deleteMany({
    where: { homeId, status: "AVAILABLE" },
  });

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
