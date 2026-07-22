// Establece fecha de agosto 2026 a paquetes vencidos (para testing en staging)
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const now = new Date();
  const homes = await p.home.findMany({
    where: {
      checkInTime: { not: null },
    },
    select: { id: true, title: true, checkInTime: true, publishStatus: true },
  });

  const expired = homes.filter(function(h) {
    if (!h.checkInTime) return false;
    return new Date(h.checkInTime) < now;
  });

  console.log(`Paquetes vencidos encontrados: ${expired.length}`);

  let count = 0;
  for (const h of expired) {
    const oldDate = new Date(h.checkInTime);
    const newDate = new Date(2026, 7, 15 + count); // Agosto 15, 16, 17...
    await p.home.update({
      where: { id: h.id },
      data: {
        checkInTime: newDate.toISOString().slice(0, 16),
        publishStatus: "APPROVED",
      },
    });
    console.log(`${h.title}: ${oldDate.toISOString().slice(0, 10)} → ${newDate.toISOString().slice(0, 10)} (+ APPROVED)`);
    count++;
  }

  await p.$disconnect();
  console.log(`\n${count} paquetes reactivados.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
