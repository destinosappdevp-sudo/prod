import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const results = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end }, status: 'CONFIRMED' },
        select: { subtotal: true },
      });
      const total = payments.reduce((sum, p) => sum + (p.subtotal || 0), 0);
      const label = start.toLocaleString('es-VE', { month: 'short', year: '2-digit' });
      results.push({ month: label, total: Math.round(total * 100) / 100 });
    }
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json([]);
  }
}
