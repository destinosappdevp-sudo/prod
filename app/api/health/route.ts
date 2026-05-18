import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { createClient } from '@/app/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Check environment variables
  health.checks.env = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    database_url: !!process.env.DATABASE_URL,
    direct_url: !!process.env.DIRECT_URL,
  };

  // Check Prisma connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.prisma = { status: 'ok' };
  } catch (error) {
    health.checks.prisma = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check Supabase connection
  try {
    const supabase = await createClient();
    const { data: session, error } = await supabase.auth.getSession();
    health.checks.supabase = { 
      status: error ? 'error' : 'ok',
      message: error?.message || undefined,
    };
  } catch (error) {
    health.checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check User model
  try {
    const count = await prisma.user.count();
    health.checks.user_model = { status: 'ok', count };
  } catch (error) {
    health.checks.user_model = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const allOk = Object.values(health.checks).every((check: any) => check.status === 'ok' || check.status === undefined);

  return NextResponse.json(health, {
    status: allOk ? 200 : 500,
  });
}
