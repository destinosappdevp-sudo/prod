/**
 * Sincroniza los PackageSeat de un paquete según los nuevos totales de cupos.
 * - Elimina los asientos AVAILABLE que ya no correspondan.
 * - Crea los nuevos asientos AVAILABLE.
 * - Los asientos OCCUPIED (ya reservados) nunca se eliminan.
 */
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

  const COLUMNS = ["A", "B", "C", "D"];

  function buildSeatList(total: number, zone: "VIP" | "STANDARD", startRow: number) {
    const seats: { zone: "VIP" | "STANDARD"; row: number; column: string }[] = [];
    let count = 0;
    let row = startRow;
    while (count < total) {
      for (const col of COLUMNS) {
        if (count >= total) break;
        seats.push({ zone, row, column: col });
        count++;
      }
      row++;
    }
    return seats;
  }

  // Obtener asientos OCCUPIED actuales (no se tocan)
  const occupiedSeats = await packageSeatDelegate.findMany({
    where: { homeId, status: "OCCUPIED" },
    select: { zone: true, row: true, column: true },
  });

  const occupiedKeys = new Set(
    occupiedSeats.map((s: any) => `${s.zone}-${s.row}-${s.column}`)
  );

  // Eliminar todos los asientos AVAILABLE
  await packageSeatDelegate.deleteMany({
    where: { homeId, status: "AVAILABLE" },
  });

  // Calcular la fila de inicio para los asientos Estándar
  // Los VIP ocupan las primeras filas, los Standard van después
  const vipRows = vipSeats > 0 ? Math.ceil(vipSeats / 4) : 0;
  const standardStartRow = vipRows + 1;

  const vipList = buildSeatList(vipSeats, "VIP", 1);
  const stdList = buildSeatList(standardSeats, "STANDARD", standardStartRow);

  const allDesiredSeats = [...vipList, ...stdList];

  // Crear los asientos deseados que no estén ya OCCUPIED
  for (const seat of allDesiredSeats) {
    const key = `${seat.zone}-${seat.row}-${seat.column}`;
    if (occupiedKeys.has(key)) continue; // ya existe como OCCUPIED

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



