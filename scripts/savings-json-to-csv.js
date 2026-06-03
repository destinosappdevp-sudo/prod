#!/usr/bin/env node
// Convierte savings-full.json a CSV con columnas nombradas.
// Uso: node scripts/savings-json-to-csv.js [input.json] [output.csv]

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
  const inArg = process.argv[2] || 'savings-full.json';
  const outArg = process.argv[3] || 'savings-full.csv';
  const inPath = path.resolve(process.cwd(), inArg);
  const outPath = path.resolve(process.cwd(), outArg);

  if (!fs.existsSync(inPath)) {
    console.error('Input file not found:', inPath);
    process.exit(2);
  }

  const raw = fs.readFileSync(inPath, 'utf8');
  let rows;
  try {
    rows = JSON.parse(raw);
  } catch (err) {
    console.error('Error parsing JSON:', err);
    process.exit(2);
  }

  const headers = [
    'id',
    'userId',
    'userEmail',
    'userName',
    'status',
    'date',
    'createdAt',
    'amountUsd',
    'amountBs',
    'bcvRate',
    'kind',
    'homeId',
    'homeTitle',
    'reservationId',
    'referenceNumber',
    'paymentProofUrl',
    'seatId',
    'seatIds',
    'packageGoalUsd',
    'packageSavedUsdBeforeThisDeposit',
    'packageSavedUsdAfterThisDeposit',
    'createdByAdmin',
    'rejectionReason',
    'paymentDetailsRaw'
  ];

  const lines = [];
  lines.push(headers.join(','));

  for (const r of rows) {
    const paymentDetails = (r.paymentDetails && typeof r.paymentDetails === 'object') ? r.paymentDetails : {};
    const user = r.User || {};

    const seatIds = Array.isArray(paymentDetails.seatIds) ? paymentDetails.seatIds.join(';') : (typeof paymentDetails.seatIds === 'string' ? paymentDetails.seatIds : '');

    const createdByAdmin = paymentDetails.createdByAdmin === true ? 'true' : '';

    const line = [
      quote(r.id),
      quote(r.userId),
      quote(user.email || ''),
      quote(user.firstName || ''),
      quote(r.status || ''),
      quote(r.date || ''),
      quote(r.createdAt || ''),
      quote(r.amountUsd ?? ''),
      quote(r.amountBs ?? ''),
      quote(r.bcvRate ?? ''),
      quote(paymentDetails.kind ?? ''),
      quote(paymentDetails.homeId ?? ''),
      quote(paymentDetails.homeTitle ?? ''),
      quote(paymentDetails.reservationId ?? ''),
      quote(paymentDetails.referenceNumber ?? ''),
      quote(paymentDetails.paymentProofUrl ?? ''),
      quote(paymentDetails.seatId ?? ''),
      quote(seatIds),
      quote(paymentDetails.packageGoalUsd ?? ''),
      quote(paymentDetails.packageSavedUsdBeforeThisDeposit ?? ''),
      quote(paymentDetails.packageSavedUsdAfterThisDeposit ?? ''),
      quote(createdByAdmin),
      quote(r.rejectionReason ?? ''),
      quote(JSON.stringify(paymentDetails))
    ].join(',');

    lines.push(line);
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${rows.length} rows to ${outPath}`);
}

main();
