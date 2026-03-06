import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Usuarios por mes del último año
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: start } },
    select: { createdAt: true },
  });
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { month: `${date.getFullYear()}-${date.getMonth() + 1}`, count: 0 };
  });
  users.forEach(u => {
    const m = `${u.createdAt.getFullYear()}-${u.createdAt.getMonth() + 1}`;
    const found = months.find(x => x.month === m);
    if (found) found.count++;
  });
  return NextResponse.json(months);
}
