import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Ingresos mensuales del último año
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const payments = await prisma.payment.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true, amount: true },
  });
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { month: `${date.getFullYear()}-${date.getMonth() + 1}`, total: 0 };
  });
  payments.forEach(p => {
    const m = `${p.createdAt.getFullYear()}-${p.createdAt.getMonth() + 1}`;
    const found = months.find(x => x.month === m);
    if (found) found.total += p.amount;
  });
  return NextResponse.json(months);
}
