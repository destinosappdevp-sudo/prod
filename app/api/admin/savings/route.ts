import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

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
    const amountBs = Number(body?.amountBs);

    if (!userId || !type) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    if (!Number.isFinite(amountBs) || amountBs <= 0) {
      return NextResponse.json({ error: "Debes indicar un monto inicial válido en Bs." }, { status: 400 });
    }

    if (type === "package" && !homeId) {
      return NextResponse.json({ error: "Debes seleccionar un paquete" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
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

    let paymentDetails: Prisma.InputJsonValue = {
      createdByAdmin: true,
      initialAmountBs: amountBs,
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
        initialAmountBs: amountBs,
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

    const amountUsd = Math.round((amountBs / bcvRate) * 100) / 100;

    if (existingSaving) {
      const previousDetails =
        existingSaving.paymentDetails && typeof existingSaving.paymentDetails === "object"
          ? (existingSaving.paymentDetails as Record<string, unknown>)
          : {};

      const currentAmountBs = Number(existingSaving.amountBs ?? 0);
      const currentAmountUsd = Number(existingSaving.amountUsd ?? 0);

      const updated = await (prisma as any).saving.update({
        where: { id: existingSaving.id },
        data: {
          amountBs: currentAmountBs + amountBs,
          amountUsd: currentAmountUsd + amountUsd,
          bcvRate,
          status: "APPROVED",
          paymentDetails: {
            ...previousDetails,
            createdByAdmin: true,
            lastAdminTopUpBs: amountBs,
            lastAdminTopUpUsd: amountUsd,
            lastAdminTopUpRate: bcvRate,
            lastAdminTopUpAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({ saving: updated, mode: "updated" });
    }

    const paymentDetailsWithAudit = {
      ...(paymentDetails as Record<string, unknown>),
      initialAmountUsd: amountUsd,
      bcvRateAtCreation: bcvRate,
    };

    const saving = await prisma.saving.create({
      data: {
        userId,
        amountBs,
        amountUsd,
        bcvRate,
        status: "APPROVED",
        paymentDetails: paymentDetailsWithAudit,
      },
    });

    return NextResponse.json({ saving, mode: "created" });
  } catch (error) {
    console.error("Error al crear alcancía desde admin:", error);
    return NextResponse.json({ error: "Error al crear alcancía" }, { status: 500 });
  }
}
