import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const results = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await prisma.home.count({
        where: { createdAt: { gte: start, lt: end } },
      });
      const label = start.toLocaleString('es-VE', { month: 'short', year: '2-digit' });
      results.push({ month: label, count });
    }
    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json([]);
  }
}
