#!/usr/bin/env node
// Auditoria de integridad para Savings + Payments + Reservations.
// Uso: node scripts/audit-transactions.js [out-prefix]

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function asDetails(value) {
  return value && typeof value === 'object' ? value : {};
}

async function main() {
  const outPrefix = process.argv[2] || 'audit-transactions';
  const outJson = path.resolve(process.cwd(), `${outPrefix}.json`);
  const outMd = path.resolve(process.cwd(), `${outPrefix}.md`);

  const prisma = new PrismaClient();

  try {
    const [savings, payments, reservations] = await Promise.all([
      prisma.saving.findMany({
        orderBy: [{ createdAt: 'asc' }, { date: 'asc' }],
        include: {
          User: { select: { id: true, email: true, firstName: true } },
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          Reservation: {
            select: {
              id: true,
              userId: true,
              homeId: true,
              totalAmount: true,
              status: true,
            },
          },
        },
      }),
      prisma.reservation.findMany({
        select: { id: true, userId: true, homeId: true, status: true, totalAmount: true },
      }),
    ]);

    const reservationIdSet = new Set(reservations.map((r) => r.id));
    const findings = [];

    // 1) Savings que apuntan a reservationId inexistente
    for (const s of savings) {
      const d = asDetails(s.paymentDetails);
      const reservationId = typeof d.reservationId === 'string' && d.reservationId.trim() ? d.reservationId.trim() : null;
      if (reservationId && !reservationIdSet.has(reservationId)) {
        findings.push({
          severity: 'high',
          type: 'SAVING_RESERVATION_BROKEN_REF',
          savingId: s.id,
          userId: s.userId,
          reservationId,
          message: 'Saving referencia una reserva que no existe.',
        });
      }
    }

    // 2) Payments huérfanos
    for (const p of payments) {
      if (p.reservationId && !p.Reservation) {
        findings.push({
          severity: 'high',
          type: 'PAYMENT_RESERVATION_BROKEN_REF',
          paymentId: p.id,
          reservationId: p.reservationId,
          message: 'Payment referencia una reserva inexistente.',
        });
      }
    }

    // 3) Consistencia de acumulados por paquete en APPROVED > 0
    const packageRows = savings.filter((s) => {
      const d = asDetails(s.paymentDetails);
      return (
        s.status === 'APPROVED' &&
        Number(s.amountUsd) > 0 &&
        typeof d.homeId === 'string' &&
        d.homeId.trim().length > 0
      );
    });

    const running = new Map();

    for (const s of packageRows) {
      const d = asDetails(s.paymentDetails);
      const homeId = d.homeId.trim();
      const key = `${s.userId}:${homeId}`;
      const beforeExpected = round2(running.get(key) || 0);
      const afterExpected = round2(beforeExpected + Number(s.amountUsd));

      const beforeStored = Number.isFinite(Number(d.packageSavedUsdBeforeThisDeposit))
        ? round2(Number(d.packageSavedUsdBeforeThisDeposit))
        : null;
      const afterStored = Number.isFinite(Number(d.packageSavedUsdAfterThisDeposit))
        ? round2(Number(d.packageSavedUsdAfterThisDeposit))
        : null;

      if (beforeStored !== null && beforeStored !== beforeExpected) {
        findings.push({
          severity: 'medium',
          type: 'PACKAGE_BEFORE_MISMATCH',
          savingId: s.id,
          userId: s.userId,
          homeId,
          beforeExpected,
          beforeStored,
          message: 'packageSavedUsdBeforeThisDeposit no coincide con el acumulado esperado.',
        });
      }

      if (afterStored !== null && afterStored !== afterExpected) {
        findings.push({
          severity: 'medium',
          type: 'PACKAGE_AFTER_MISMATCH',
          savingId: s.id,
          userId: s.userId,
          homeId,
          afterExpected,
          afterStored,
          message: 'packageSavedUsdAfterThisDeposit no coincide con el acumulado esperado.',
        });
      }

      running.set(key, afterExpected);
    }

    // 4) Señales de posible sobrescritura/anomalia
    for (const s of savings) {
      const d = asDetails(s.paymentDetails);
      const kind = typeof d.kind === 'string' ? d.kind : '';

      if (s.status === 'APPROVED' && kind === 'PACKAGE_SAVING_DEPOSIT' && Number(s.amountUsd) <= 0) {
        findings.push({
          severity: 'medium',
          type: 'APPROVED_PACKAGE_NON_POSITIVE',
          savingId: s.id,
          userId: s.userId,
          amountUsd: Number(s.amountUsd),
          message: 'APPROVED PACKAGE_SAVING_DEPOSIT con amountUsd <= 0.',
        });
      }

      if (s.status === 'REJECTED' && (!s.rejectionReason || !String(s.rejectionReason).trim())) {
        findings.push({
          severity: 'low',
          type: 'REJECTED_WITHOUT_REASON',
          savingId: s.id,
          userId: s.userId,
          message: 'Saving REJECTED sin rejectionReason.',
        });
      }
    }

    const summary = {
      generatedAt: new Date().toISOString(),
      counts: {
        savings: savings.length,
        payments: payments.length,
        reservations: reservations.length,
        savingsByStatus: savings.reduce((acc, s) => {
          acc[s.status] = (acc[s.status] || 0) + 1;
          return acc;
        }, {}),
        paymentsByStatus: payments.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {}),
      },
      findingsCount: findings.length,
      findings,
    };

    fs.writeFileSync(outJson, JSON.stringify(summary, null, 2), 'utf8');

    const lines = [];
    lines.push('# Auditoria de Transacciones');
    lines.push('');
    lines.push(`Generado: ${summary.generatedAt}`);
    lines.push('');
    lines.push('## Conteos');
    lines.push(`- Savings: ${summary.counts.savings}`);
    lines.push(`- Payments: ${summary.counts.payments}`);
    lines.push(`- Reservations: ${summary.counts.reservations}`);
    lines.push(`- Findings: ${summary.findingsCount}`);
    lines.push('');
    lines.push('### Savings por estado');
    for (const [k, v] of Object.entries(summary.counts.savingsByStatus)) {
      lines.push(`- ${k}: ${v}`);
    }
    lines.push('');
    lines.push('### Payments por estado');
    const paymentStatusEntries = Object.entries(summary.counts.paymentsByStatus);
    if (paymentStatusEntries.length === 0) {
      lines.push('- (sin registros)');
    } else {
      for (const [k, v] of paymentStatusEntries) {
        lines.push(`- ${k}: ${v}`);
      }
    }
    lines.push('');
    lines.push('## Hallazgos');
    if (findings.length === 0) {
      lines.push('- No se detectaron inconsistencias de integridad con las reglas aplicadas.');
    } else {
      findings.forEach((f, idx) => {
        lines.push(`- [${idx + 1}] (${f.severity}) ${f.type}: ${f.message}`);
      });
    }

    fs.writeFileSync(outMd, lines.join('\n'), 'utf8');

    console.log(`Saved ${outJson}`);
    console.log(`Saved ${outMd}`);
    console.log(`Findings: ${findings.length}`);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

main();
