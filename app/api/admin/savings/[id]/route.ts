import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { FROM_EMAIL, getResendClient } from "@/app/lib/resend";

export const dynamic = "force-dynamic";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeDetails(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? { ...(value as Record<string, any>) } : {};
}

async function sendPackageGoalCompletedEmails(params: {
  userEmail: string;
  userName: string;
  packageTitle: string;
  packageGoalUsd: number;
  adminEmail?: string | null;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[admin/savings] Resend no configurado; se omiten emails de meta completada");
    return;
  }

  const safeUserName = (params.userName || "Viajero").replace(/[<>]/g, "");
  const safePackageTitle = (params.packageTitle || "Paquete").replace(/[<>]/g, "");

  const userHtml = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;line-height:1.6">
      <h2 style="margin:0 0 12px 0;color:#065f46">Meta completada</h2>
      <p>Hola <strong>${safeUserName}</strong>,</p>
      <p>Tu plan de ahorro para <strong>${safePackageTitle}</strong> se completó con éxito.</p>
      <p>Meta alcanzada: <strong>$${params.packageGoalUsd.toFixed(2)} USD</strong>.</p>
      <p>Si hubo excedente en el último depósito, ya fue movido automáticamente a tu alcancía general.</p>
      <p style="color:#475569">Equipo Destinos Venezuela</p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;line-height:1.6">
      <h2 style="margin:0 0 12px 0;color:#1d4ed8">Ahorro completado por usuario</h2>
      <p>Usuario: <strong>${safeUserName}</strong> (${params.userEmail})</p>
      <p>Paquete: <strong>${safePackageTitle}</strong></p>
      <p>Meta: <strong>$${params.packageGoalUsd.toFixed(2)} USD</strong></p>
      <p>La meta fue alcanzada y el sistema bloquea nuevos depósitos para este viaje.</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject: "Meta de ahorro completada",
      html: userHtml,
    });
  } catch (err) {
    console.error("[admin/savings] Error enviando correo a usuario:", err);
  }

  const adminTarget =
    (typeof params.adminEmail === "string" && params.adminEmail.trim()) ||
    process.env.ADMIN_EMAIL ||
    process.env.NOTIFICATIONS_EMAIL ||
    "colombeiaweb@gmail.com";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminTarget,
      subject: "Usuario completó su ahorro",
      html: adminHtml,
    });
  } catch (err) {
    console.error("[admin/savings] Error enviando correo a admin:", err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      ((userRecord as any).role !== "ADMIN" &&
        (userRecord as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const rejectionReason =
      typeof body?.rejectionReason === "string" ? body.rejectionReason.trim() : "";

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "reject" && !rejectionReason) {
      return NextResponse.json(
        { error: "Debes indicar un motivo para rechazar el depósito" },
        { status: 400 }
      );
    }

    const saving = await (prisma as any).saving.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            firstName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!saving) {
      return NextResponse.json({ error: "Depósito no encontrado" }, { status: 404 });
    }

    if (saving.status !== "PENDING") {
      return NextResponse.json({ error: "Este depósito ya fue procesado" }, { status: 400 });
    }

    if (action === "reject") {
      const rejected = await (prisma as any).saving.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason,
        },
      });

      return NextResponse.json(rejected);
    }

    const details = normalizeDetails(saving.paymentDetails);
    const homeId = typeof details.homeId === "string" && details.homeId.trim() ? details.homeId.trim() : null;

    let completedNow = false;
    let completedGoalUsd = 0;
    let completedPackageTitle = "";

    const updated = await prisma.$transaction(async (tx) => {
      if (!homeId) {
        return tx.saving.update({
          where: { id },
          data: {
            status: "APPROVED",
            rejectionReason: null,
          },
        });
      }

      const home = await tx.home.findUnique({
        where: { id: homeId },
        select: { id: true, title: true, price: true },
      });

      const packageGoalUsd = Number(home?.price ?? 0);
      if (!home || packageGoalUsd <= 0) {
        return tx.saving.update({
          where: { id },
          data: {
            status: "APPROVED",
            rejectionReason: null,
          },
        });
      }

      const approvedDeposits = await tx.saving.findMany({
        where: {
          userId: saving.userId,
          status: "APPROVED",
          amountUsd: { gt: 0 },
        },
        select: { amountUsd: true, paymentDetails: true },
      });

      const approvedPackageUsd = roundMoney(
        approvedDeposits.reduce((sum: number, row: any) => {
          const rowDetails = normalizeDetails(row.paymentDetails);
          const rowHomeId = typeof rowDetails.homeId === "string" ? rowDetails.homeId : null;
          if (rowHomeId !== homeId) return sum;
          return sum + Number(row.amountUsd ?? 0);
        }, 0)
      );

      const depositUsd = roundMoney(Number(saving.amountUsd ?? 0));
      const depositBs = roundMoney(Number(saving.amountBs ?? 0));
      const remainingUsd = roundMoney(Math.max(0, packageGoalUsd - approvedPackageUsd));
      const approvedForPackageUsd = roundMoney(Math.min(remainingUsd, depositUsd));
      const overflowUsd = roundMoney(Math.max(0, depositUsd - approvedForPackageUsd));

      const approvedForPackageBs =
        depositUsd > 0 ? roundMoney((depositBs * approvedForPackageUsd) / depositUsd) : 0;
      const overflowBs = roundMoney(depositBs - approvedForPackageBs);

      const packageSavedAfterUsd = roundMoney(approvedPackageUsd + approvedForPackageUsd);
      const packageCompletedNow = approvedForPackageUsd > 0 && approvedPackageUsd < packageGoalUsd && packageSavedAfterUsd >= packageGoalUsd;

      completedNow = packageCompletedNow;
      completedGoalUsd = packageGoalUsd;
      completedPackageTitle = home.title || details.homeTitle || "Paquete";

      if (approvedForPackageUsd <= 0) {
        const convertedDetails = {
          ...details,
          kind: "GENERAL_SAVING_OVERFLOW_FROM_PACKAGE",
          homeId: null,
          homeTitle: null,
          overflowFromHomeId: homeId,
          overflowFromHomeTitle: home.title || details.homeTitle || "Paquete",
          overflowReason: "PACKAGE_GOAL_COMPLETED",
          sourceSavingId: saving.id,
          packageGoalUsd,
          packageSavedUsdBeforeThisDeposit: approvedPackageUsd,
          packageSavedUsdAfterThisDeposit: approvedPackageUsd,
        };

        return tx.saving.update({
          where: { id },
          data: {
            status: "APPROVED",
            rejectionReason: null,
            paymentDetails: convertedDetails,
          },
        });
      }

      const updatedSaving = await tx.saving.update({
        where: { id },
        data: {
          status: "APPROVED",
          rejectionReason: null,
          amountUsd: approvedForPackageUsd,
          amountBs: approvedForPackageBs,
          paymentDetails: {
            ...details,
            kind: "PACKAGE_SAVING_DEPOSIT",
            packageGoalUsd,
            packageSavedUsdBeforeThisDeposit: approvedPackageUsd,
            packageSavedUsdAfterThisDeposit: packageSavedAfterUsd,
            packageCompleted: packageSavedAfterUsd >= packageGoalUsd,
          },
        },
      });

      if (overflowUsd > 0) {
        await tx.saving.create({
          data: {
            userId: saving.userId,
            bcvRate: Number(saving.bcvRate ?? 0),
            amountUsd: overflowUsd,
            amountBs: overflowBs,
            status: "APPROVED",
            paymentDetails: {
              ...details,
              kind: "GENERAL_SAVING_OVERFLOW_FROM_PACKAGE",
              homeId: null,
              homeTitle: null,
              overflowFromHomeId: homeId,
              overflowFromHomeTitle: home.title || details.homeTitle || "Paquete",
              overflowReason: "PACKAGE_GOAL_REACHED",
              sourceSavingId: saving.id,
              packageGoalUsd,
              packageSavedUsdBeforeThisDeposit: approvedPackageUsd,
              packageSavedUsdAfterThisDeposit: packageSavedAfterUsd,
            },
          },
        });
      }

      return updatedSaving;
    });

    if (completedNow && saving.User?.email) {
      const displayName =
        (saving.User.firstName && saving.User.firstName.trim()) ||
        saving.User.email ||
        "Viajero";

      void sendPackageGoalCompletedEmails({
        userEmail: saving.User.email,
        userName: displayName,
        packageTitle: completedPackageTitle,
        packageGoalUsd: completedGoalUsd,
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error en PATCH /api/admin/savings/[id]:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
