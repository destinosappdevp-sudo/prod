#!/usr/bin/env node
// Exporta todo el histórico de la tabla `payment` a JSON y CSV.
// Uso: node scripts/export-payments.js [out-prefix]
// Ejemplo: node scripts/export-payments.js payments-full

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

function quote(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function main() {
  const outPrefix = process.argv[2] || 'payments-full';
  const jsonPath = path.resolve(process.cwd(), `${outPrefix}.json`);
  const csvPath = path.resolve(process.cwd(), `${outPrefix}.csv`);

  const prisma = new PrismaClient();
  try {
    console.log('Conectando a la base de datos para exportar payments...');
    const rows = await prisma.payment.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        Reservation: {
          include: {
            User: { select: { id: true, firstName: true, email: true } },
            Home: { select: { id: true, title: true } },
          },
        },
      },
    });

    const normalized = rows.map((r) => {
      const copy = { ...r };
      if (copy.createdAt instanceof Date) copy.createdAt = copy.createdAt.toISOString();
      if (copy.confirmedAt instanceof Date) copy.confirmedAt = copy.confirmedAt.toISOString();
      return copy;
    });

    fs.writeFileSync(jsonPath, JSON.stringify(normalized, null, 2), 'utf8');
    console.log(`Exported ${normalized.length} payments to ${jsonPath}`);

    const headers = [
      'id',
      'userId',
      'userEmail',
      'userName',
      'reservationId',
      'homeId',
      'homeTitle',
      'status',
      'createdAt',
      'confirmedAt',
      'amount',
      'subtotal',
      'serviceFee',
      'currency',
      'paymentMethod',
      'referenceNumber',
      'paymentProofUrl',
      'rejectionReason',
      'paymentDetailsRaw'
    ];

    const lines = [headers.join(',')];

    for (const r of rows) {
      const reservation = r.Reservation || {};
      const user = reservation.User || {};
      const home = reservation.Home || {};
      const line = [
        quote(r.id),
        quote(user.id || r.userId || ''),
        quote(user.email || ''),
        quote(user.firstName || ''),
        quote(reservation.id || ''),
        quote(home.id || ''),
        quote(home.title || ''),
        quote(r.status || ''),
        quote(r.createdAt ? (new Date(r.createdAt)).toISOString() : ''),
        quote(r.confirmedAt ? (new Date(r.confirmedAt)).toISOString() : ''),
        quote(r.amount ?? ''),
        quote(r.subtotal ?? ''),
        quote(r.serviceFee ?? ''),
        quote(r.currency ?? ''),
        quote(r.paymentMethod ?? ''),
        quote(r.referenceNumber ?? ''),
        quote(r.paymentProofUrl ?? ''),
        quote(r.rejectionReason ?? ''),
        quote(JSON.stringify(r.paymentDetails || {})),
      ].join(',');

      lines.push(line);
    }

    fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
    console.log(`Wrote ${rows.length} rows to ${csvPath}`);
  } catch (err) {
    console.error('Error exporting payments:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
