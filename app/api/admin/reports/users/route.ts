import prisma from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const now = new Date();
    const results = [];
    
    // Single aggregated query instead of 12 separate queries
    const rawResults = await (prisma as any).$queryRaw`
      SELECT 
        DATE_TRUNC('month', r."createdAt") as month,
        COUNT(DISTINCT r."userId") as count
      FROM "Reservation" r
      WHERE r."createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', r."createdAt")
      ORDER BY month ASC
    ` as Array<{ month: Date; count: bigint }>;
    
    // Fill missing months with zeros
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = start.toLocaleString('es-VE', { month: 'short', year: '2-digit' });
      const found = rawResults.find((r) => {
        const rMonth = new Date(r.month);
        return rMonth.getFullYear() === start.getFullYear() && 
               rMonth.getMonth() === start.getMonth();
      });
      results.push({ month: label, count: found ? Number(found.count) : 0 });
    }
    
    return NextResponse.json(results);
  } catch (e) {
    console.error('Error in users report:', e);
    return NextResponse.json([]);
  }
}
