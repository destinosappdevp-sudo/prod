import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Buscar todos los pagos del usuario
  const payments = await prismaAny.payment.findMany({
    where: { Reservation: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      Reservation: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          Home: { select: { title: true, country: true, municipality: true } },
        },
      },
    },
  });

  return NextResponse.json(payments);
}
