import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/app/lib/audit-log";

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
      select: { id: true, paymentDetails: true, amountBs: true, amountUsd: true, status: true },
    });

    const existingWalletSaving = allUserSavings.find((saving: any) => {
      const details = saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? saving.paymentDetails
        : {};
      const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;

      if (type === "general") {
        return !targetHomeId;
      }

      return targetHomeId === homeId;
    });

    if (type === "package" && !existingWalletSaving) {
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
    let currentPackageTitle = "";
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

        if (row.status === "APPROVED") {
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

    if (type === "package" && homeId) {
      const existingWalletDetails =
        existingWalletSaving?.paymentDetails && typeof existingWalletSaving.paymentDetails === "object"
          ? (existingWalletSaving.paymentDetails as Record<string, unknown>)
          : {};

      const existingSeatIdsInput = Array.isArray(existingWalletDetails.seatIds)
        ? existingWalletDetails.seatIds
        : typeof existingWalletDetails.seatIds === "string"
        ? existingWalletDetails.seatIds.split(",")
        : [];

      const existingSeatIds = Array.from(
        new Set(
          existingSeatIdsInput
            .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean)
        )
      );

      const existingSeatId =
        typeof existingWalletDetails.seatId === "string" && existingWalletDetails.seatId.trim()
          ? existingWalletDetails.seatId.trim()
          : existingSeatIds[0] || null;

      const remainingUsd = roundMoney(Math.max(0, packageGoalUsd - approvedPackageUsdBefore));
      const approvedForPackageUsd = roundMoney(Math.min(remainingUsd, amountUsd));
      const overflowUsd = roundMoney(Math.max(0, amountUsd - approvedForPackageUsd));
      const approvedForPackageBs =
        amountUsd > 0 ? roundMoney((amountBs * approvedForPackageUsd) / amountUsd) : 0;
      const overflowBs = roundMoney(amountBs - approvedForPackageBs);

      const packageSavedAfterUsd = roundMoney(approvedPackageUsdBefore + approvedForPackageUsd);
      const packageCompletedNow =
        approvedForPackageUsd > 0 &&
        approvedPackageUsdBefore < packageGoalUsd &&
        packageSavedAfterUsd >= packageGoalUsd;

      const result = await prisma.$transaction(async (tx) => {
        let reservationId: string | null = null;
        let createdReservation = false;

        if (approvedForPackageUsd > 0) {
          const existingReservation = await tx.reservation.findFirst({
            where: {
              userId,
              homeId,
              status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
            },
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true },
          });

          reservationId = existingReservation?.id ?? null;
          createdReservation = !reservationId;

          if (!reservationId) {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 86400000);
            const reservation = await tx.reservation.create({
              data: {
                userId,
                homeId,
                startDate,
                endDate,
                nights: 1,
                status: packageCompletedNow ? "CONFIRMED" : "PENDING",
                totalAmount: packageGoalUsd,
                ...(existingSeatId ? { seatId: existingSeatId } : {}),
              },
              select: { id: true },
            });
            reservationId = reservation.id;
          } else if (packageCompletedNow && existingReservation?.status === "PENDING") {
            await tx.reservation.update({
              where: { id: reservationId },
              data: { status: "CONFIRMED" },
            });
          }
        }

        let createdSaving: any = null;

        if (approvedForPackageUsd > 0) {
          createdSaving = await tx.saving.create({
            data: {
              userId,
              amountBs: approvedForPackageBs,
              amountUsd: approvedForPackageUsd,
              bcvRate,
              status: "APPROVED",
              ...(depositDate ? { date: depositDate } : {}),
              paymentDetails: {
                ...(paymentDetails as Record<string, unknown>),
                createdByAdmin: true,
                seatId: existingSeatId,
                seatIds: existingSeatIds,
                plan:
                  currentPackagePlan ||
                  (typeof existingWalletDetails.plan === "string" ? existingWalletDetails.plan : null),
                guests:
                  typeof existingWalletDetails.guests === "number" && existingWalletDetails.guests > 0
                    ? existingWalletDetails.guests
                    : currentPackageEffectiveGuests,
                initialAmountUsd: approvedForPackageUsd,
                initialAmountBs: approvedForPackageBs,
                bcvRateAtCreation: bcvRate,
                packageGoalUsd,
                packageSavedUsdBeforeThisDeposit: approvedPackageUsdBefore,
                packageSavedUsdAfterThisDeposit: packageSavedAfterUsd,
                packageCompleted: packageSavedAfterUsd >= packageGoalUsd,
                reservationId,
                autoCreatedReservation: createdReservation,
              },
            },
          });
        }

        if (packageCompletedNow && reservationId) {
          const approvedNegativeSavings = await tx.saving.findMany({
            where: {
              userId,
              status: "APPROVED",
              amountUsd: { lt: 0 },
            },
            select: { paymentDetails: true },
          });

          const hasCheckoutDebit = approvedNegativeSavings.some((row: any) => {
            const rowDetails = row.paymentDetails && typeof row.paymentDetails === "object" ? row.paymentDetails : {};
            return rowDetails.kind === "CHECKOUT_DEBIT" && rowDetails.reservationId === reservationId;
          });

          if (!hasCheckoutDebit) {
            const debitAmountBs = roundMoney(packageGoalUsd * bcvRate);
            await tx.saving.create({
              data: {
                userId,
                bcvRate,
                amountUsd: -packageGoalUsd,
                amountBs: debitAmountBs > 0 ? -debitAmountBs : 0,
                status: "APPROVED",
                paymentDetails: {
                  kind: "CHECKOUT_DEBIT",
                  checkoutMode: "SAVINGS",
                  reservationId,
                  homeId,
                  homeTitle: currentPackageTitle || null,
                  seatId: existingSeatId,
                  seatIds: existingSeatIds,
                  amountUsd: -packageGoalUsd,
                  amountBs: debitAmountBs > 0 ? -debitAmountBs : 0,
                  autoCreatedFromSavingApproval: true,
                  sourceSavingId: createdSaving?.id || null,
                },
              },
            });
          }
        }

        if (overflowUsd > 0) {
          await tx.saving.create({
            data: {
              userId,
              bcvRate,
              amountUsd: overflowUsd,
              amountBs: overflowBs,
              status: "APPROVED",
              ...(depositDate ? { date: depositDate } : {}),
              paymentDetails: {
                createdByAdmin: true,
                kind: "GENERAL_SAVING_OVERFLOW_FROM_PACKAGE",
                homeId: null,
                homeTitle: null,
                overflowFromHomeId: homeId,
                overflowFromHomeTitle: currentPackageTitle || "Paquete",
                overflowReason: "PACKAGE_GOAL_REACHED",
                sourceSavingId: createdSaving?.id || null,
                initialAmountUsd: overflowUsd,
                initialAmountBs: overflowBs,
                bcvRateAtCreation: bcvRate,
                packageGoalUsd,
                packageSavedUsdBeforeThisDeposit: approvedPackageUsdBefore,
                packageSavedUsdAfterThisDeposit: packageSavedAfterUsd,
              },
            },
          });
        }

        return {
          saving: createdSaving,
          completedToReservation: packageCompletedNow,
          reservationId,
          packageGoalUsd,
          packageSavedUsdAfterThisDeposit: packageSavedAfterUsd,
          approvedForPackageUsd,
          approvedForPackageBs,
          overflowUsd,
          overflowBs,
        };
      });

      try {
        await writeAuditLog({
          eventType: "ADMIN_SAVING_DEPOSIT_CREATED",
          sourceRoute: "POST /api/admin/savings",
          actorType: "ADMIN",
          actorId: user.id,
          affectedUserId: userId,
          transactionId: result?.saving?.id ?? null,
          statusBefore: null,
          statusAfter: "APPROVED",
          amountUsd: Number(result?.saving?.amountUsd ?? result?.approvedForPackageUsd ?? 0),
          amountBs: Number(result?.saving?.amountBs ?? result?.approvedForPackageBs ?? 0),
          bcvRate: Number(bcvRate ?? 0),
          metadata: {
            walletType: "package",
            homeId,
            reservationId: result?.reservationId ?? null,
            packageGoalUsd: result?.packageGoalUsd ?? null,
            packageSavedUsdAfterThisDeposit: result?.packageSavedUsdAfterThisDeposit ?? null,
            overflowUsd: result?.overflowUsd ?? 0,
            overflowBs: result?.overflowBs ?? 0,
            inputAmountUsd: amountUsd,
            inputAmountBs: amountBs,
          },
        });
      } catch (auditError) {
        console.error("[audit-log] Error registrando depósito admin (package):", auditError);
      }

      return NextResponse.json({
        saving: result.saving,
        mode: "created",
        completedToReservation: result.completedToReservation,
        reservationId: result.reservationId,
        packageGoalUsd: result.packageGoalUsd,
        packageSavedUsdAfterThisDeposit: result.packageSavedUsdAfterThisDeposit,
      });
    }

    const saving = await prisma.saving.create({
      data: {
        userId,
        amountBs,
        amountUsd,
        bcvRate,
        status: "APPROVED",
        ...(depositDate ? { date: depositDate } : {}),
        paymentDetails: {
          ...(paymentDetails as Record<string, unknown>),
          createdByAdmin: true,
          initialAmountUsd: amountUsd,
          initialAmountBs: amountBs,
          bcvRateAtCreation: bcvRate,
        },
      },
    });

    try {
      await writeAuditLog({
        eventType: "ADMIN_SAVING_DEPOSIT_CREATED",
        sourceRoute: "POST /api/admin/savings",
        actorType: "ADMIN",
        actorId: user.id,
        affectedUserId: userId,
        transactionId: saving.id,
        statusBefore: null,
        statusAfter: saving.status,
        amountUsd: Number(saving.amountUsd ?? amountUsd ?? 0),
        amountBs: Number(saving.amountBs ?? amountBs ?? 0),
        bcvRate: Number(saving.bcvRate ?? bcvRate ?? 0),
        metadata: {
          walletType: "general",
          inputAmountUsd: amountUsd,
          inputAmountBs: amountBs,
        },
      });
    } catch (auditError) {
      console.error("[audit-log] Error registrando depósito admin (general):", auditError);
    }

    return NextResponse.json({
      saving,
      mode: "created",
      completedToReservation: false,
      reservationId: null,
    });
  } catch (error) {
    console.error("Error al registrar abono desde admin:", error);
    return NextResponse.json({ error: "Error al registrar el abono" }, { status: 500 });
  }
}



