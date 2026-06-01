import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

const prismaAny = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !currentUser ||
      ((currentUser as any).role !== "ADMIN" && (currentUser as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const type = body?.type === "package" ? "package" : body?.type === "general" ? "general" : null;
    const homeId = typeof body?.homeId === "string" ? body.homeId : null;
    const amountUsdInput = Number(body?.amountUsd);
    const amountBsLegacyInput = Number(body?.amountBs);
    const hasAmountUsd = Number.isFinite(amountUsdInput) && amountUsdInput > 0;
    const hasAmountBsLegacy = Number.isFinite(amountBsLegacyInput) && amountBsLegacyInput > 0;

    // Fecha manual opcional (para cargas históricas). Si no viene, se usa la fecha actual.
    const rawDate = typeof body?.date === "string" ? body.date : null;
    let depositDate: Date | null = null;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Fecha del depósito inválida." }, { status: 400 });
      }
      depositDate = parsed;
    }

    if (!userId || !type) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    if (!hasAmountUsd && !hasAmountBsLegacy) {
      return NextResponse.json({ error: "Debes indicar un monto inicial válido en USD." }, { status: 400 });
    }

    if (type === "package" && !homeId) {
      return NextResponse.json({ error: "Debes seleccionar un paquete" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const allUserSavings = await (prisma as any).saving.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { id: true, paymentDetails: true, amountBs: true, amountUsd: true },
    });

    const existingSaving = allUserSavings.find((saving: any) => {
      const details = saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? saving.paymentDetails
        : {};
      const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;

      if (type === "general") {
        return !targetHomeId;
      }

      return targetHomeId === homeId;
    });

    if (type === "package" && !existingSaving) {
      return NextResponse.json(
        { error: "Solo puedes abonar a alcancías específicas existentes para este usuario." },
        { status: 400 }
      );
    }

    let paymentDetails: Prisma.InputJsonValue = {
      createdByAdmin: true,
    };

    if (type === "package" && homeId) {
      const home = await prisma.home.findUnique({
        where: { id: homeId },
        select: { id: true, title: true },
      });

      if (!home) {
        return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
      }

      paymentDetails = {
        createdByAdmin: true,
        homeId: home.id,
        homeTitle: home.title,
      };
    }

    const config = await (prisma as any).platformConfig.findFirst({
      select: { bcvRate: true },
    });
    const bcvRate = Number(config?.bcvRate ?? 0);

    if (!bcvRate || bcvRate <= 0) {
      return NextResponse.json({ error: "Tasa BCV no disponible" }, { status: 400 });
    }

    // Calcular montos: USD es la moneda principal; Bs se deriva con la tasa BCV.
    const amountUsd = hasAmountUsd
      ? Math.round(amountUsdInput * 100) / 100
      : Math.round((amountBsLegacyInput / bcvRate) * 100) / 100;
    const amountBs = hasAmountUsd
      ? Math.round(amountUsdInput * bcvRate * 100) / 100
      : Math.round(amountBsLegacyInput * 100) / 100;

    let packageGoalUsd = 0;
    let approvedPackageUsdBefore = 0;
    let currentPackageReservationId: string | null = null;
    let currentPackageTitle = "";
    let currentPackageCompleted = false;
    let currentPackageEffectiveGuests = 1;
    let currentPackagePlan: "vip" | "estandar" | null = null;

    if (type === "package" && homeId) {
      const home = await prisma.home.findUnique({
        where: { id: homeId },
        select: { id: true, title: true, price: true, priceVip: true },
      });

      if (!home) {
        return NextResponse.json({ error: "Paquete no encontrado" }, { status: 404 });
      }

      currentPackageTitle = home.title || "Paquete";

      const packageRows = allUserSavings.filter((saving: any) => {
        const details = saving.paymentDetails && typeof saving.paymentDetails === "object"
          ? saving.paymentDetails
          : {};
        const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;
        return targetHomeId === homeId && Number(saving.amountUsd ?? 0) > 0;
      });

      let inferredGuestsCount = 0;
      let inferredPlan: "vip" | "estandar" | null = null;

      for (const row of packageRows as any[]) {
        const details = row.paymentDetails && typeof row.paymentDetails === "object"
          ? row.paymentDetails
          : {};

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
          const planValue = details.plan.trim().toLowerCase();
          if (planValue === "vip" || planValue === "estandar") {
            inferredPlan = planValue;
          }
        }

        if (row.status === "APPROVED" && row.id !== existingSaving.id) {
          approvedPackageUsdBefore += Number(row.amountUsd ?? 0);
        }
      }

      currentPackageEffectiveGuests = Math.max(inferredGuestsCount, 1);
      currentPackagePlan = inferredPlan;
      const unitPrice =
        currentPackagePlan === "vip" && Number(home.priceVip ?? 0) > 0
          ? Number(home.priceVip)
          : Number(home.price ?? 0);
      packageGoalUsd = roundMoney(unitPrice * currentPackageEffectiveGuests);
    }

    if (existingSaving) {
      const previousDetails =
        existingSaving.paymentDetails && typeof existingSaving.paymentDetails === "object"
          ? (existingSaving.paymentDetails as Record<string, unknown>)
          : {};

      const currentAmountBs = Number(existingSaving.amountBs ?? 0);
      const currentAmountUsd = Number(existingSaving.amountUsd ?? 0);

      // Combine el monto ya existente en el registro con el aporte manual del admin
      const totalDepositUsd = roundMoney(currentAmountUsd + amountUsd);
      const totalDepositBs = roundMoney(currentAmountBs + amountBs);

      // Actualizar considerando el total combinado y dividir entre paquete/overflow en una sola operación
      if (type === "package" && homeId && packageGoalUsd > 0) {
        const approvedPackageUsdAfterThisDeposit = roundMoney(approvedPackageUsdBefore + totalDepositUsd);
        const packageCompletedNow = approvedPackageUsdAfterThisDeposit >= packageGoalUsd;
        const remainingUsd = roundMoney(Math.max(0, packageGoalUsd - approvedPackageUsdBefore));
        const approvedForPackageUsd = roundMoney(Math.min(remainingUsd, totalDepositUsd));
        const overflowUsd = roundMoney(Math.max(0, totalDepositUsd - approvedForPackageUsd));
        const approvedForPackageBs =
          totalDepositUsd > 0 ? roundMoney((totalDepositBs * approvedForPackageUsd) / totalDepositUsd) : 0;
        const overflowBs = roundMoney(totalDepositBs - approvedForPackageBs);

        const existingReservation = await prismaAny.reservation.findFirst({
          where: {
            userId,
            homeId,
            status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        });

        let reservationId = existingReservation?.id ?? null;
        const createdReservation = !reservationId;

        if (!reservationId) {
          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + 86400000);
          const reservation = await prismaAny.reservation.create({
            data: {
              userId,
              homeId,
              startDate,
              endDate,
              nights: 1,
              status: packageCompletedNow ? "CONFIRMED" : "PENDING",
              totalAmount: packageGoalUsd,
            },
            select: { id: true },
          });
          reservationId = reservation.id;
        } else if (packageCompletedNow && existingReservation?.status === "PENDING") {
          await prismaAny.reservation.update({
            where: { id: reservationId },
            data: { status: "CONFIRMED" },
          });
        }

        const updated = await (prisma as any).saving.update({
          where: { id: existingSaving.id },
          data: {
            amountUsd: approvedForPackageUsd,
            amountBs: approvedForPackageBs,
            bcvRate,
            status: "APPROVED",
            ...(depositDate ? { date: depositDate } : {}),
            paymentDetails: {
              ...previousDetails,
              createdByAdmin: true,
              lastAdminTopUpBs: amountBs,
              lastAdminTopUpUsd: amountUsd,
              lastAdminTopUpRate: bcvRate,
              lastAdminTopUpAt: new Date().toISOString(),
              ...(depositDate ? { lastAdminTopUpDate: depositDate.toISOString() } : {}),
              packageGoalUsd,
              packageSavedUsdBeforeThisDeposit: approvedPackageUsdBefore,
              packageSavedUsdAfterThisDeposit: approvedPackageUsdAfterThisDeposit,
              packageCompleted: packageCompletedNow,
              reservationId,
              autoCreatedReservation: createdReservation,
            },
          },
        });

        currentPackageReservationId = reservationId;
        currentPackageCompleted = packageCompletedNow;

        if (packageCompletedNow && overflowUsd > 0) {
          await prisma.saving.create({
            data: {
              userId,
              bcvRate,
              amountUsd: overflowUsd,
              amountBs: overflowBs,
              status: "APPROVED",
              paymentDetails: {
                ...previousDetails,
                kind: "GENERAL_SAVING_OVERFLOW_FROM_PACKAGE",
                homeId: null,
                homeTitle: null,
                overflowFromHomeId: homeId,
                overflowFromHomeTitle: currentPackageTitle,
                overflowReason: "PACKAGE_GOAL_REACHED",
                sourceSavingId: existingSaving.id,
                packageGoalUsd,
                packageSavedUsdBeforeThisDeposit: approvedPackageUsdBefore,
                packageSavedUsdAfterThisDeposit: approvedPackageUsdAfterThisDeposit,
              },
            },
          });
        }

        return NextResponse.json({ saving: updated, mode: "updated" });
      }

      // Si no es paquete, simplemente sumar y aprobar
      const updated = await (prisma as any).saving.update({
        where: { id: existingSaving.id },
        data: {
          amountBs: currentAmountBs + amountBs,
          amountUsd: currentAmountUsd + amountUsd,
          bcvRate,
          status: "APPROVED",
          ...(depositDate ? { date: depositDate } : {}),
          paymentDetails: {
            ...previousDetails,
            createdByAdmin: true,
            lastAdminTopUpBs: amountBs,
            lastAdminTopUpUsd: amountUsd,
            lastAdminTopUpRate: bcvRate,
            lastAdminTopUpAt: new Date().toISOString(),
            ...(depositDate ? { lastAdminTopUpDate: depositDate.toISOString() } : {}),
          },
        },
      });

      return NextResponse.json({ saving: updated, mode: "updated" });
    }

    const paymentDetailsWithAudit = {
      ...(paymentDetails as Record<string, unknown>),
      initialAmountUsd: amountUsd,
      initialAmountBs: amountBs,
      bcvRateAtCreation: bcvRate,
    };

    const saving = await prisma.saving.create({
      data: {
        userId,
        amountBs,
        amountUsd,
        bcvRate,
        status: "APPROVED",
        ...(depositDate ? { date: depositDate } : {}),
        paymentDetails: paymentDetailsWithAudit,
      },
    });

    return NextResponse.json({ saving, mode: "created" });
  } catch (error) {
    console.error("Error al registrar abono desde admin:", error);
    return NextResponse.json({ error: "Error al registrar el abono" }, { status: 500 });
  }
}



