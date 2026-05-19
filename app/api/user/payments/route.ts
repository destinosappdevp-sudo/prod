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

  // Buscar todos los pagos del usuario (reservas)
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

  // Buscar todos los depósitos a la alcancía (ahorros)
  const savings = await prismaAny.saving.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Normalizar ahorros al formato de movimiento
  const savingMovs = (savings as any[]).map((s) => {
    const details = s.paymentDetails && typeof s.paymentDetails === "object" ? s.paymentDetails : {};
    return {
      id: `saving_${s.id}`,
      kind: "SAVING",
      createdAt: s.createdAt ?? s.date,
      amount: Number(s.amountUsd ?? 0),
      paymentMethod: "PAGO_MOVIL",
      status: s.status ?? "PENDING",
      referenceNumber: details.referenceNumber ?? null,
      rejectionReason: s.rejectionReason ?? null,
      paymentDetails: {
        amountUsd: Number(s.amountUsd ?? 0),
        amountBs: Number(s.amountBs ?? 0),
        ...details,
      },
      Reservation: null,
      isSaving: true,
    };
  });

  // Marcar pagos para distinguirlos en UI
  const paymentMovs = (payments as any[]).map((p) => ({ ...p, kind: "PAYMENT" }));

  // Combinar y ordenar por fecha desc
  const all = [...paymentMovs, ...savingMovs].sort((a, b) => {
    const da = new Date(a.createdAt ?? 0).getTime();
    const db = new Date(b.createdAt ?? 0).getTime();
    return db - da;
  });

  return NextResponse.json(all);
}



