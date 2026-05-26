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

  const amountBsInput = Number((body as any)?.amountBs);
  const amountUsdInput = Number((body as any)?.amountUsd);

  const config = await prismaAny.platformConfig.findFirst({
    select: { bcvRate: true },
  });
  const bcvRate = Number(config?.bcvRate ?? 0);
  if (!bcvRate) {
    return NextResponse.json({ error: "Tasa BCV no disponible" }, { status: 400 });
  }

  const hasValidUsdInput = Number.isFinite(amountUsdInput) && amountUsdInput > 0;
  const hasValidBsInput = Number.isFinite(amountBsInput) && amountBsInput > 0;

  if (!hasValidUsdInput && !hasValidBsInput) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
  }

  const amountUsd = hasValidUsdInput
    ? roundMoney(amountUsdInput)
    : roundMoney(amountBsInput / bcvRate);
  const amountBs = hasValidUsdInput
    ? roundMoney(amountUsd * bcvRate)
    : roundMoney(amountBsInput);

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

  const seatIdsInput = Array.isArray(paymentDetailsInput.seatIds)
    ? paymentDetailsInput.seatIds
    : typeof paymentDetailsInput.seatIds === "string"
    ? paymentDetailsInput.seatIds.split(",")
    : [];

  const seatIds = Array.from(
    new Set(
      seatIdsInput
        .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
    )
  );

  if (seatIds.length === 0 && seatId) {
    seatIds.push(seatId);
  }

  let homeTitle =
    typeof paymentDetailsInput.homeTitle === "string" && paymentDetailsInput.homeTitle.trim()
      ? paymentDetailsInput.homeTitle.trim()
      : null;

  if (homeId) {
    const paidReservation = await prismaAny.reservation.findFirst({
      where: {
        userId: user.id,
        homeId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (paidReservation) {
      return NextResponse.json(
        {
          error: "Este viaje ya está pagado y no admite nuevos abonos",
          reservationId: paidReservation.id,
        },
        { status: 409 }
      );
    }

    const home = await prismaAny.home.findUnique({
      where: { id: homeId },
      select: { id: true, title: true, price: true, priceVip: true },
    });

    if (!home) {
      return NextResponse.json({ error: "Paquete no válido" }, { status: 400 });
    }

    const inputGuestsCount =
      seatIds.length > 0
        ? seatIds.length
        : typeof paymentDetailsInput.guests === "number" && paymentDetailsInput.guests > 0
        ? paymentDetailsInput.guests
        : 1;
    const inputPlan =
      typeof paymentDetailsInput.plan === "string" && paymentDetailsInput.plan.trim()
        ? paymentDetailsInput.plan.trim().toLowerCase()
        : null;

    // Reutiliza el contexto real del paquete (huéspedes/plan) desde depósitos previos
    // para evitar falsos "meta completada" cuando el payload viene incompleto.
    const packageRows = await prismaAny.saving.findMany({
      where: {
        userId: user.id,
        amountUsd: { gt: 0 },
      },
      select: { amountUsd: true, status: true, paymentDetails: true },
    });

    let inferredGuestsCount = 0;
    let inferredPlan: string | null = null;

    const approvedPackageUsd = roundMoney(
      packageRows.reduce((sum: number, row: any) => {
        const details = row.paymentDetails && typeof row.paymentDetails === "object" ? row.paymentDetails : {};
        const rowHomeId = typeof details.homeId === "string" ? details.homeId : null;
        if (rowHomeId !== homeId) return sum;

        const rowSeatIdsInput = Array.isArray(details.seatIds)
          ? details.seatIds
          : typeof details.seatIds === "string"
          ? details.seatIds.split(",")
          : [];
        const rowSeatIds = Array.from(
          new Set(
            rowSeatIdsInput
              .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
              .filter(Boolean)
          )
        );
        const rowGuests =
          typeof details.guests === "number" && details.guests > 0
            ? details.guests
            : 0;
        inferredGuestsCount = Math.max(
          inferredGuestsCount,
          rowSeatIds.length > 0 ? rowSeatIds.length : rowGuests
        );

        if (!inferredPlan && typeof details.plan === "string" && details.plan.trim()) {
          inferredPlan = details.plan.trim().toLowerCase();
        }

        if (row.status !== "APPROVED") return sum;
        return sum + Number(row.amountUsd ?? 0);
      }, 0)
    );

    const effectiveGuestsCount = Math.max(inputGuestsCount, inferredGuestsCount, 1);
    const effectivePlan = inputPlan || inferredPlan;
    const unitPrice =
      effectivePlan === "vip" && Number(home.priceVip ?? 0) > 0
        ? Number(home.priceVip)
        : Number(home.price ?? 0);
    const packageGoalUsd = roundMoney(unitPrice * effectiveGuestsCount);

    if (packageGoalUsd > 0 && approvedPackageUsd >= packageGoalUsd) {
      return NextResponse.json(
        {
          error:
            "Ya completaste el ahorro de este viaje. Los próximos depósitos deben ir a tu alcancía general.",
        },
        { status: 400 }
      );
    }

    homeTitle = homeTitle || home.title || "Paquete";
  }

  const paymentDetails = {
    ...paymentDetailsInput,
    paymentProofUrl,
    homeId,
    homeTitle,
    seatId: seatIds[0] || null,
    seatIds,
    kind: homeId ? "PACKAGE_SAVING_DEPOSIT" : "GENERAL_SAVING_DEPOSIT",
  };

  const shouldReserveSeat = Boolean(homeId && seatIds.length > 0);

  // El depósito se crea en PENDING hasta que el admin lo apruebe.
  // Si viene seatId+homeId, también se ocupa el asiento para que el flujo de ahorro lo reserve.
  let saving: any;
  try {
    saving = await prismaAny.$transaction(async (tx: any) => {
      if (shouldReserveSeat) {
        const selectedSeats = await tx.packageSeat.findMany({
          where: { id: { in: seatIds } },
          select: { id: true, homeId: true, status: true },
        });

        if (selectedSeats.length !== seatIds.length) {
          throw new Error("Asiento inválido para este paquete");
        }

        const invalidSeat = selectedSeats.find((seat: any) => seat.homeId !== homeId);
        if (invalidSeat) {
          throw new Error("Asiento inválido para este paquete");
        }

        const availableSeatIds = selectedSeats
          .filter((s: any) => s.status === "AVAILABLE")
          .map((s: any) => s.id);
        const occupiedSeatIds = selectedSeats
          .filter((s: any) => s.status !== "AVAILABLE")
          .map((s: any) => s.id);

        // Si hay asientos ocupados, verificar que sean del propio usuario
        // (porque ya los reservó en un abono previo de este paquete).
        if (occupiedSeatIds.length > 0) {
          const ownedRows = await tx.saving.findMany({
            where: { userId: user.id },
            select: { paymentDetails: true },
          });
          const ownedSeatIds = new Set<string>();
          for (const row of ownedRows) {
            const details = row.paymentDetails && typeof row.paymentDetails === "object" ? row.paymentDetails : {};
            const rowHomeId = typeof (details as any).homeId === "string" ? (details as any).homeId : null;
            if (rowHomeId !== homeId) continue;
            const rowSeatIds = Array.isArray((details as any).seatIds)
              ? (details as any).seatIds
              : typeof (details as any).seatIds === "string"
              ? (details as any).seatIds.split(",")
              : [];
            for (const s of rowSeatIds) {
              if (typeof s === "string" && s.trim()) ownedSeatIds.add(s.trim());
            }
            const singleSeat = (details as any).seatId;
            if (typeof singleSeat === "string" && singleSeat.trim()) ownedSeatIds.add(singleSeat.trim());
          }

          const foreignSeat = occupiedSeatIds.find((id: string) => !ownedSeatIds.has(id));
          if (foreignSeat) {
            throw new Error("Uno de los asientos seleccionados ya fue ocupado por otro usuario");
          }
        }

        if (availableSeatIds.length > 0) {
          const updatedSeat = await tx.packageSeat.updateMany({
            where: { id: { in: availableSeatIds }, status: "AVAILABLE" },
            data: { status: "OCCUPIED" },
          });

          if (updatedSeat.count !== availableSeatIds.length) {
            throw new Error("Uno de los asientos seleccionados ya fue ocupado por otro usuario");
          }
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



