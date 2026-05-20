import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const savings = await prismaAny.saving.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    select: { id: true, date: true, bcvRate: true, amountBs: true, amountUsd: true },
  });

  return NextResponse.json(savings);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const amountBs = Number((body as any)?.amountBs);
  if (!amountBs || amountBs <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const config = await prismaAny.platformConfig.findFirst({
    select: { bcvRate: true },
  });
  const bcvRate = Number(config?.bcvRate ?? 0);
  if (!bcvRate) {
    return NextResponse.json({ error: "Tasa BCV no disponible" }, { status: 400 });
  }

  const amountUsd = Math.round((amountBs / bcvRate) * 100) / 100;

  const paymentDetailsInput =
    (body as any)?.paymentDetails && typeof (body as any).paymentDetails === "object"
      ? { ...(body as any).paymentDetails }
      : {};

  const paymentProofUrl =
    typeof paymentDetailsInput.paymentProofUrl === "string" && paymentDetailsInput.paymentProofUrl.trim()
      ? paymentDetailsInput.paymentProofUrl.trim()
      : null;

  if (!paymentProofUrl) {
    return NextResponse.json({ error: "Debes adjuntar la captura del pago móvil" }, { status: 400 });
  }

  const homeId =
    typeof paymentDetailsInput.homeId === "string" && paymentDetailsInput.homeId.trim()
      ? paymentDetailsInput.homeId.trim()
      : null;

  const seatId =
    typeof paymentDetailsInput.seatId === "string" && paymentDetailsInput.seatId.trim()
      ? paymentDetailsInput.seatId.trim()
      : null;

  let homeTitle =
    typeof paymentDetailsInput.homeTitle === "string" && paymentDetailsInput.homeTitle.trim()
      ? paymentDetailsInput.homeTitle.trim()
      : null;

  if (homeId) {
    const home = await prismaAny.home.findUnique({
      where: { id: homeId },
      select: { id: true, title: true, price: true },
    });

    if (!home) {
      return NextResponse.json({ error: "Paquete no válido" }, { status: 400 });
    }

    const packageGoalUsd = Number(home.price ?? 0);
    if (packageGoalUsd > 0) {
      const approvedDeposits = await prismaAny.saving.findMany({
        where: {
          userId: user.id,
          status: "APPROVED",
          amountUsd: { gt: 0 },
        },
        select: { amountUsd: true, paymentDetails: true },
      });

      const approvedPackageUsd = roundMoney(
        approvedDeposits.reduce((sum: number, row: any) => {
          const details = row.paymentDetails && typeof row.paymentDetails === "object" ? row.paymentDetails : {};
          const rowHomeId = typeof details.homeId === "string" ? details.homeId : null;
          if (rowHomeId !== homeId) return sum;
          return sum + Number(row.amountUsd ?? 0);
        }, 0)
      );

      if (approvedPackageUsd >= packageGoalUsd) {
        return NextResponse.json(
          {
            error:
              "Ya completaste el ahorro de este viaje. Los próximos depósitos deben ir a tu alcancía general.",
          },
          { status: 400 }
        );
      }
    }

    homeTitle = homeTitle || home.title || "Paquete";
  }

  const paymentDetails = {
    ...paymentDetailsInput,
    paymentProofUrl,
    homeId,
    homeTitle,
    seatId,
    kind: homeId ? "PACKAGE_SAVING_DEPOSIT" : "GENERAL_SAVING_DEPOSIT",
  };

  const shouldReserveSeat = Boolean(homeId && seatId);

  // El depósito se crea en PENDING hasta que el admin lo apruebe.
  // Si viene seatId+homeId, también se ocupa el asiento para que el flujo de ahorro lo reserve.
  let saving: any;
  try {
    saving = await prismaAny.$transaction(async (tx: any) => {
      if (shouldReserveSeat) {
        const seat = await tx.packageSeat.findUnique({
          where: { id: seatId },
          select: { id: true, homeId: true, status: true },
        });

        if (!seat || seat.homeId !== homeId) {
          throw new Error("Asiento inválido para este paquete");
        }

        const updatedSeat = await tx.packageSeat.updateMany({
          where: { id: seatId, status: "AVAILABLE" },
          data: { status: "OCCUPIED" },
        });

        if (updatedSeat.count === 0) {
          throw new Error("El asiento seleccionado ya fue ocupado por otro usuario");
        }
      }

      return tx.saving.create({
        data: {
          userId: user.id,
          bcvRate,
          amountBs,
          amountUsd,
          paymentDetails,
          status: "PENDING",
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar el ahorro";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(saving, { status: 201 });
}



