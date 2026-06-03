#!/usr/bin/env node
// Convierte audit-transactions.json a CSV.
// Uso: node scripts/audit-json-to-csv.js [input.json] [output.csv]

const fs = require('fs');
const path = require('path');

function q(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function main() {
  const inArg = process.argv[2] || 'audit-transactions.json';
  const outArg = process.argv[3] || 'audit-transactions.csv';

  const inPath = path.resolve(process.cwd(), inArg);
  const outPath = path.resolve(process.cwd(), outArg);

  if (!fs.existsSync(inPath)) {
    console.error('No existe el archivo de auditoria:', inPath);
    process.exit(2);
  }

  const report = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  const headers = [
    'generatedAt',
    'totalSavings',
    'totalPayments',
    'totalReservations',
    'findingsCount',
    'severity',
    'type',
    'message',
    'savingId',
    'paymentId',
    'userId',
    'homeId',
    'reservationId',
    'beforeExpected',
    'beforeStored',
    'afterExpected',
    'afterStored',
    'amountUsd',
    'rawFinding'
  ];

  const lines = [headers.join(',')];
  const findings = Array.isArray(report.findings) ? report.findings : [];

  if (findings.length === 0) {
    lines.push([
      q(report.generatedAt || ''),
      q(report?.counts?.savings ?? ''),
      q(report?.counts?.payments ?? ''),
      q(report?.counts?.reservations ?? ''),
      q(report.findingsCount ?? 0),
      '', '',
      q('Sin hallazgos de integridad'),
      '', '', '', '', '', '', '', '', '', '', ''
    ].join(','));
  } else {
    for (const f of findings) {
      lines.push([
        q(report.generatedAt || ''),
        q(report?.counts?.savings ?? ''),
        q(report?.counts?.payments ?? ''),
        q(report?.counts?.reservations ?? ''),
        q(report.findingsCount ?? findings.length),
        q(f.severity ?? ''),
        q(f.type ?? ''),
        q(f.message ?? ''),
        q(f.savingId ?? ''),
        q(f.paymentId ?? ''),
        q(f.userId ?? ''),
        q(f.homeId ?? ''),
        q(f.reservationId ?? ''),
        q(f.beforeExpected ?? ''),
        q(f.beforeStored ?? ''),
        q(f.afterExpected ?? ''),
        q(f.afterStored ?? ''),
        q(f.amountUsd ?? ''),
        q(JSON.stringify(f))
      ].join(','));
    }
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`CSV generado: ${outPath}`);
}

main();
