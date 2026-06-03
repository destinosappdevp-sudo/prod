#!/usr/bin/env node
// Exporta todo el histórico de la tabla `saving` a un JSON local.
// Uso: node scripts/export-savings.js [ruta-de-salida.json]
// Ejemplo: node scripts/export-savings.js savings-full.json

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const outArg = process.argv[2] || 'savings-full.json';
  const outPath = path.resolve(process.cwd(), outArg);

  // Prisma usará la variable de entorno DATABASE_URL del entorno donde ejecutes el script.
  const prisma = new PrismaClient();

  console.log('Conectando a la base de datos...');
  try {
    // Trae todo el histórico, ordenado por creación ascendente.
    const rows = await prisma.saving.findMany({
      orderBy: { createdAt: 'asc' },
      // Incluye usuario para referencia; quitar si prefieres solo la tabla saving.
      include: { User: true },
    });

    // Normalizar valores que JSON.stringify no maneja bien (Date -> ISO, BigInt si existiera, etc.)
    const normalized = rows.map((r) => {
      const copy = { ...r };
      if (copy.createdAt instanceof Date) copy.createdAt = copy.createdAt.toISOString();
      if (copy.date instanceof Date) copy.date = copy.date.toISOString();
      // Si paymentDetails viene como string JSON, intentar parsearlo
      try {
        if (typeof copy.paymentDetails === 'string') {
          copy.paymentDetails = JSON.parse(copy.paymentDetails);
        }
      } catch (_) {
        // keep as-is
      }
      return copy;
    });

    fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), 'utf8');
    console.log(`Exportado ${normalized.length} filas a ${outPath}`);
  } catch (err) {
    console.error('Error exportando savings:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
