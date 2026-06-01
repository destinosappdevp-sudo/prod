import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { FROM_EMAIL, getResendClient } from "@/app/lib/resend";
import { generateGuestConfirmationEmail } from "@/app/lib/email-templates";

export const dynamic = "force-dynamic";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeDetails(value: unknown): Record<string, any> {
  return value && typeof value === "object" ? { ...(value as Record<string, any>) } : {};
}

async function hasApprovedContributionsForPackageSeat(params: {
  tx: any;
  userId: string;
  homeId: string;
  seatId?: string | null;
  excludeSavingId?: string;
}) {
  const rows = await params.tx.saving.findMany({
    where: {
      userId: params.userId,
      status: "APPROVED",
      amountUsd: { gt: 0 },
      ...(params.excludeSavingId ? { id: { not: params.excludeSavingId } } : {}),
    },
    select: { paymentDetails: true },
  });

  return rows.some((row: any) => {
    const details = normalizeDetails(row.paymentDetails);
    const rowHomeId =
      typeof details.homeId === "string" && details.homeId.trim()
        ? details.homeId.trim()
        : null;
    if (rowHomeId !== params.homeId) return false;

    if (!params.seatId) return true;

    const rowSeatId =
      typeof details.seatId === "string" && details.seatId.trim()
        ? details.seatId.trim()
        : null;

    const rowSeatIds = Array.isArray(details.seatIds)
      ? details.seatIds
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [];

    // Compatibilidad con depósitos antiguos sin seatId explícito.
    return (
      rowSeatId === null ||
      rowSeatId === params.seatId ||
      rowSeatIds.includes(params.seatId)
    );
  });
}

async function sendSavingStatusEmail(params: {
  userEmail: string;
  userName: string;
  status: "APPROVED" | "REJECTED";
  amountUsd: number;
  amountBs: number;
  bcvRate: number;
  packageTitle?: string | null;
  referenceNumber?: string | null;
  rejectionReason?: string | null;
  reviewedAt: Date;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[admin/savings] Resend no configurado; se omite email de estado del depósito");
    return;
  }

  const safeName = (params.userName || "Viajero").replace(/[<>]/g, "");
  const safePackage = (params.packageTitle || "Alcancía general").replace(/[<>]/g, "");
  const safeReason = (params.rejectionReason || "").replace(/[<>]/g, "");
  const safeRef = (params.referenceNumber || "").replace(/[<>]/g, "");
  const isApproved = params.status === "APPROVED";

  const subject = isApproved
    ? "Depósito aprobado en tu alcancía"
    : "Depósito rechazado en tu alcancía";

  const html = `
    <div style="font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;line-height:1.6">
      <h2 style="margin:0 0 12px 0;color:${isApproved ? "#065f46" : "#b91c1c"}">
        ${isApproved ? "Tu depósito fue aprobado" : "Tu depósito fue rechazado"}
      </h2>
      <p>Hola <strong>${safeName}</strong>,</p>
      <p>Revisamos tu depósito de ahorro y su estado es: <strong>${isApproved ? "APROBADO" : "RECHAZADO"}</strong>.</p>
      <table cellpadding="0" cellspacing="0" style="margin:12px 0 14px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 0;min-width:160px;color:#475569;">Destino</td><td style="padding:4px 0;"><strong>${safePackage}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#475569;">Monto USD</td><td style="padding:4px 0;"><strong>$${params.amountUsd.toFixed(2)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#475569;">Monto Bs.</td><td style="padding:4px 0;"><strong>Bs ${params.amountBs.toFixed(2)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#475569;">Tasa BCV</td><td style="padding:4px 0;"><strong>${params.bcvRate.toFixed(2)}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#475569;">Fecha de revisión</td><td style="padding:4px 0;"><strong>${params.reviewedAt.toLocaleString("es-VE")}</strong></td></tr>
        ${safeRef ? `<tr><td style="padding:4px 0;color:#475569;">Referencia</td><td style="padding:4px 0;"><strong>${safeRef}</strong></td></tr>` : ""}
      </table>
      ${!isApproved && safeReason ? `<p><strong>Motivo del rechazo:</strong> ${safeReason}</p>` : ""}
      <p style="color:#475569">Equipo Destinos Venezuela</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.userEmail,
      subject,
      html,
    });
  } catch (err) {
    console.error("[admin/savings] Error enviando email de estado del depósito:", err);
  }
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

async function sendReservationConfirmationToGuest(params: {
  reservationId: string;
  fallbackBcvRate?: number;
}) {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[admin/savings] Resend no configurado; se omite email de reserva confirmada");
    return;
  }

  const prismaAny = prisma as any;
  const reservation = await prismaAny.reservation.findUnique({
    where: { id: params.reservationId },
    include: {
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
      Home: {
        select: {
          title: true,
          exactAddress: true,
          municipality: true,
          country: true,
          guests: true,
          userId: true,
        },
      },
      Payment: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          paymentDetails: true,
        },
      },
    },
  });

  if (!reservation?.User?.email || !reservation?.Home) {
    console.warn("[admin/savings] Datos incompletos para enviar email de reserva confirmada");
    return;
  }

  const host = await prismaAny.user.findUnique({
    where: { id: reservation.Home.userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
    },
  });

  if (!host?.email) {
    console.warn("[admin/savings] Host no encontrado para email de reserva confirmada");
    return;
  }

  let amountUsd: number | undefined;
  let amountBs: number | undefined;
  let bcvRate: number | undefined;
  const paymentDetails = reservation.Payment?.[0]?.paymentDetails;

  if (paymentDetails) {
    try {
      const parsed =
        typeof paymentDetails === "string" ? JSON.parse(paymentDetails) : paymentDetails;
      amountUsd = parsed?.amountUsd ? Number(parsed.amountUsd) : undefined;
      amountBs = parsed?.amountBs ? Number(parsed.amountBs) : undefined;
      bcvRate = parsed?.bcvRateUsed ? Number(parsed.bcvRateUsed) : undefined;
    } catch {
      // Si falla el parse, se usan fallback values.
    }
  }

  if (amountUsd === undefined) {
    amountUsd = Number(reservation.totalAmount ?? 0);
  }

  if (bcvRate === undefined && params.fallbackBcvRate && params.fallbackBcvRate > 0) {
    bcvRate = params.fallbackBcvRate;
  }

  if (amountBs === undefined && amountUsd !== undefined && bcvRate && bcvRate > 0) {
    amountBs = Number((amountUsd * bcvRate).toFixed(2));
  }

  const emailData = {
    guestName:
      `${reservation.User.firstName || ""} ${reservation.User.lastName || ""}`.trim() ||
      reservation.User.email,
    guestEmail: reservation.User.email,
    guestPhone: reservation.User.phoneNumber || undefined,
    hostName:
      `${host.firstName || ""} ${host.lastName || ""}`.trim() ||
      host.email,
    hostEmail: host.email,
    hostPhone: host.phoneNumber || undefined,
    propertyTitle: reservation.Home.title || "Propiedad",
    propertyAddress: reservation.Home.exactAddress
      ? `${reservation.Home.exactAddress}, ${reservation.Home.municipality || ""}, ${reservation.Home.country || ""}`.trim()
      : `${reservation.Home.municipality || ""}, ${reservation.Home.country || ""}`.trim(),
    checkIn: new Date(reservation.startDate).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    checkOut: new Date(reservation.endDate).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    nights: reservation.nights,
    guests: reservation.Home.guests || "N/A",
    totalAmount: reservation.totalAmount,
    reservationId: reservation.id,
    amountUsd,
    amountBs,
    bcvRate,
  };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: reservation.User.email,
      subject: `🎉 Reserva Confirmada - ${reservation.Home.title || "Tu estadía"}`,
      html: generateGuestConfirmationEmail(emailData),
    });
  } catch (err) {
    console.error("[admin/savings] Error enviando email de reserva confirmada:", err);
  }
}

async function reconcileAdminPackageTopUp(params: {
  savingId: string;
  userId: string;
  homeId: string;
  fallbackBcvRate: number;
}) {
  const prismaAny = prisma as any;

  return prismaAny.$transaction(async (tx: any) => {
    const currentSaving = await tx.saving.findUnique({
      where: { id: params.savingId },
      select: {
        id: true,
        amountBs: true,
        amountUsd: true,
        bcvRate: true,
        paymentDetails: true,
        userId: true,
      },
    });

    if (!currentSaving) {
      return { completedNow: false as const };
    }

    const currentDetails = normalizeDetails(currentSaving.paymentDetails);
    const home = await tx.home.findUnique({
      where: { id: params.homeId },
      select: { id: true, title: true, price: true, priceVip: true },
    });

    if (!home) {
      return { completedNow: false as const };
    }

    const approvedPackageRows = await tx.saving.findMany({
      where: {
        userId: params.userId,
        status: "APPROVED",
        amountUsd: { gt: 0 },
      },
      select: { id: true, amountUsd: true, paymentDetails: true },
    });

    let inferredGuestsCount = 0;
    let inferredPlan: string | null = null;

    const approvedPackageUsdBeforeCurrent = roundMoney(
      approvedPackageRows.reduce((sum: number, row: any) => {
        const details = normalizeDetails(row.paymentDetails);
        const rowHomeId = typeof details.homeId === "string" ? details.homeId : null;
        if (rowHomeId !== params.homeId) return sum;
        if (row.id === params.savingId) return sum;

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
        const rowGuests = typeof details.guests === "number" && details.guests > 0 ? details.guests : 0;
        inferredGuestsCount = Math.max(inferredGuestsCount, rowSeatIds.length > 0 ? rowSeatIds.length : rowGuests);

        if (!inferredPlan && typeof details.plan === "string" && details.plan.trim()) {
          inferredPlan = details.plan.trim().toLowerCase();
        }

        return sum + Number(row.amountUsd ?? 0);
      }, 0)
    );

    const currentSeatIds = Array.isArray(currentDetails.seatIds)
      ? currentDetails.seatIds
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : typeof currentDetails.seatId === "string" && currentDetails.seatId.trim()
      ? [currentDetails.seatId.trim()]
      : [];

    const currentGuestsCount =
      typeof currentDetails.guests === "number" && currentDetails.guests > 0
        ? currentDetails.guests
        : currentSeatIds.length > 0
        ? currentSeatIds.length
        : 1;

    if (!inferredPlan && typeof currentDetails.plan === "string" && currentDetails.plan.trim()) {
      inferredPlan = currentDetails.plan.trim().toLowerCase();
    }

    const effectiveGuestsCount = Math.max(inferredGuestsCount, currentGuestsCount, 1);
    const effectivePlan =
      currentDetails.plan === "vip" || currentDetails.plan === "estandar"
        ? currentDetails.plan
        : inferredPlan === "vip" || inferredPlan === "estandar"
        ? inferredPlan
        : null;

    const unitPrice =
      effectivePlan === "vip" && Number(home.priceVip ?? 0) > 0
        ? Number(home.priceVip)
        : Number(home.price ?? 0);

    const packageGoalUsd = roundMoney(unitPrice * effectiveGuestsCount);
    const depositUsd = roundMoney(Number(currentSaving.amountUsd ?? 0));
    const depositBs = roundMoney(Number(currentSaving.amountBs ?? 0));

    if (!packageGoalUsd || packageGoalUsd <= 0) {
      await tx.saving.update({
        where: { id: params.savingId },
        data: {
          paymentDetails: {
            ...currentDetails,
            kind: "PACKAGE_SAVING_DEPOSIT",
            packageGoalUsd,
            packageCompleted: false,
          },
        },
      });

      return { completedNow: false as const };
    }

    const packageSavedAfterThisDeposit = roundMoney(approvedPackageUsdBeforeCurrent + depositUsd);
    const packageCompletedNow = packageSavedAfterThisDeposit >= packageGoalUsd;

    const existingReservation = await tx.reservation.findFirst({
      where: {
        userId: params.userId,
        homeId: params.homeId,
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
      const reservation = await tx.reservation.create({
        data: {
          userId: params.userId,
          homeId: params.homeId,
          startDate,
          endDate,
          nights: 1,
          status: packageCompletedNow ? "CONFIRMED" : "PENDING",
          totalAmount: packageGoalUsd,
          ...(currentSeatIds[0] ? { seatId: currentSeatIds[0] } : {}),
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

    const approvedPackageUsd = roundMoney(approvedPackageUsdBeforeCurrent + depositUsd);
    const remainingUsd = roundMoney(Math.max(0, packageGoalUsd - approvedPackageUsdBeforeCurrent));
    const approvedForPackageUsd = roundMoney(Math.min(remainingUsd, depositUsd));
    const overflowUsd = roundMoney(Math.max(0, depositUsd - approvedForPackageUsd));
    const approvedForPackageBs =
      depositUsd > 0 ? roundMoney((depositBs * approvedForPackageUsd) / depositUsd) : 0;
    const overflowBs = roundMoney(depositBs - approvedForPackageBs);

    await tx.saving.update({
      where: { id: params.savingId },
      data: {
        amountUsd: approvedForPackageUsd,
        amountBs: approvedForPackageBs,
        paymentDetails: {
          ...currentDetails,
          kind: "PACKAGE_SAVING_DEPOSIT",
          packageGoalUsd,
          packageSavedUsdBeforeThisDeposit: approvedPackageUsdBeforeCurrent,
          packageSavedUsdAfterThisDeposit: approvedPackageUsd,
          packageCompleted: packageCompletedNow,
          reservationId,
          autoCreatedReservation: createdReservation,
        },
      },
    });

    if (packageCompletedNow && overflowUsd > 0) {
      await tx.saving.create({
        data: {
          userId: params.userId,
          bcvRate: Number(currentSaving.bcvRate ?? params.fallbackBcvRate ?? 0),
          amountUsd: overflowUsd,
          amountBs: overflowBs,
          status: "APPROVED",
          paymentDetails: {
            ...currentDetails,
            kind: "GENERAL_SAVING_OVERFLOW_FROM_PACKAGE",
            homeId: null,
            homeTitle: null,
            overflowFromHomeId: params.homeId,
            overflowFromHomeTitle: home.title || currentDetails.homeTitle || "Paquete",
            overflowReason: "PACKAGE_GOAL_REACHED",
            sourceSavingId: params.savingId,
            packageGoalUsd,
            packageSavedUsdBeforeThisDeposit: approvedPackageUsdBeforeCurrent,
            packageSavedUsdAfterThisDeposit: approvedPackageUsd,
          },
        },
      });
    }

    return {
      completedNow: packageCompletedNow,
      reservationId,
      packageGoalUsd,
      packageTitle: home.title || currentDetails.homeTitle || "Paquete",
    };
  });
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
      const details = normalizeDetails(saving.paymentDetails);
      const homeId =
        typeof details.homeId === "string" && details.homeId.trim()
          ? details.homeId.trim()
          : null;
      const reservationId =
        typeof details.reservationId === "string" && details.reservationId.trim()
          ? details.reservationId.trim()
          : null;
      const seatId =
        typeof details.seatId === "string" && details.seatId.trim()
          ? details.seatId.trim()
          : null;
      const seatIds = Array.isArray(details.seatIds)
        ? details.seatIds
            .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean)
        : [];

      const rejected = await (prisma as any).$transaction(async (tx: any) => {
        const updated = await tx.saving.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason,
          },
        });

        if (homeId) {
          const allSeatIds = Array.from(new Set([...(seatId ? [seatId] : []), ...seatIds]));

          for (const selectedSeatId of allSeatIds) {
            const hasPriorBalance = await hasApprovedContributionsForPackageSeat({
              tx,
              userId: saving.userId,
              homeId,
              seatId: selectedSeatId,
              excludeSavingId: saving.id,
            });

            if (!hasPriorBalance) {
              await tx.packageSeat.updateMany({
                where: { id: selectedSeatId, homeId, status: "OCCUPIED" },
                data: { status: "AVAILABLE" },
              });
            }
          }

          const approvedRows = await tx.saving.findMany({
            where: {
              userId: saving.userId,
              status: "APPROVED",
              amountUsd: { gt: 0 },
              id: { not: saving.id },
            },
            select: { paymentDetails: true },
          });

          const hasApprovedBalanceForPackage = approvedRows.some((row: any) => {
            const rowDetails = normalizeDetails(row.paymentDetails);
            const rowHomeId =
              typeof rowDetails.homeId === "string" && rowDetails.homeId.trim()
                ? rowDetails.homeId.trim()
                : null;
            return rowHomeId === homeId;
          });

          // Si este rechazo deja el ahorro del paquete en 0 aprobado,
          // cancelar reserva pendiente sin pago (flujo de ahorro) y liberar su bloqueo lógico.
          if (!hasApprovedBalanceForPackage) {
            const reservationIdsFromSavings = approvedRows
              .map((row: any) => {
                const rowDetails = normalizeDetails(row.paymentDetails);
                const rowHomeId =
                  typeof rowDetails.homeId === "string" && rowDetails.homeId.trim()
                    ? rowDetails.homeId.trim()
                    : null;
                const rowReservationId =
                  typeof rowDetails.reservationId === "string" && rowDetails.reservationId.trim()
                    ? rowDetails.reservationId.trim()
                    : null;

                if (rowHomeId !== homeId || !rowReservationId) {
                  return null;
                }

                return rowReservationId;
              })
              .filter(Boolean);

            const targetReservationIds = Array.from(
              new Set([...(reservationId ? [reservationId] : []), ...reservationIdsFromSavings])
            );

            if (targetReservationIds.length > 0) {
              await tx.reservation.updateMany({
                where: {
                  id: { in: targetReservationIds },
                  userId: saving.userId,
                  homeId,
                  status: "PENDING",
                  OR: [
                    { Payment: { is: null } },
                    { Payment: { is: { amount: 0 } } },
                  ],
                },
                data: { status: "CANCELLED" },
              });
            }

            await tx.reservation.updateMany({
              where: {
                userId: saving.userId,
                homeId,
                status: "PENDING",
                OR: [
                  { Payment: { is: null } },
                  { Payment: { is: { amount: 0 } } },
                ],
              },
              data: { status: "CANCELLED" },
            });
          }
        }

        return updated;
      });

      if (saving.User?.email) {
        const details = normalizeDetails(saving.paymentDetails);
        const userName =
          (saving.User.firstName && saving.User.firstName.trim()) ||
          saving.User.email ||
          "Viajero";
        await sendSavingStatusEmail({
          userEmail: saving.User.email,
          userName,
          status: "REJECTED",
          amountUsd: Number(saving.amountUsd ?? 0),
          amountBs: Number(saving.amountBs ?? 0),
          bcvRate: Number(saving.bcvRate ?? 0),
          packageTitle:
            typeof details.homeTitle === "string" && details.homeTitle.trim()
              ? details.homeTitle.trim()
              : null,
          referenceNumber:
            typeof details.referenceNumber === "string" ? details.referenceNumber : null,
          rejectionReason,
          reviewedAt: new Date(),
        });
      }

      return NextResponse.json(rejected);
    }

    const details = normalizeDetails(saving.paymentDetails);
    const homeId = typeof details.homeId === "string" && details.homeId.trim() ? details.homeId.trim() : null;
    const seatId =
      typeof details.seatId === "string" && details.seatId.trim()
        ? details.seatId.trim()
        : null;
    const seatIds = Array.isArray(details.seatIds)
      ? details.seatIds
          .map((item: unknown) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [];

    let completedNow = false;
    let completedGoalUsd = 0;
    let completedPackageTitle = "";
    let completedReservationId: string | null = null;

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
        select: { id: true, title: true, price: true, priceVip: true },
      });

      const savingGuestsCount =
        seatIds.length > 0
          ? seatIds.length
          : typeof details.guests === "number" && details.guests > 0
          ? details.guests
          : 1;
      const savingPlan = typeof details.plan === "string" ? details.plan : null;
      const unitPrice =
        savingPlan === "vip" && Number(home?.priceVip ?? 0) > 0
          ? Number(home!.priceVip)
          : Number(home?.price ?? 0);
      const packageGoalUsd = roundMoney(unitPrice * savingGuestsCount);
      if (!home || unitPrice <= 0) {
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

      let updatedSaving = await tx.saving.update({
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

      const existingReservation = await tx.reservation.findFirst({
        where: {
          userId: saving.userId,
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
        const reservation = await tx.reservation.create({
          data: {
            userId: saving.userId,
            homeId,
            startDate,
            endDate,
            nights: 1,
            status: packageCompletedNow ? "CONFIRMED" : "PENDING",
            totalAmount: packageGoalUsd,
            ...(seatId ? { seatId } : {}),
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

      updatedSaving = await tx.saving.update({
        where: { id: updatedSaving.id },
        data: {
          paymentDetails: {
            ...normalizeDetails(updatedSaving.paymentDetails),
            reservationId,
            packageCompleted: packageSavedAfterUsd >= packageGoalUsd,
            autoCreatedReservation: createdReservation,
          },
        },
      });

      if (packageCompletedNow) {
        completedReservationId = reservationId;

        const approvedNegativeSavings = await tx.saving.findMany({
          where: {
            userId: saving.userId,
            status: "APPROVED",
            amountUsd: { lt: 0 },
          },
          select: { id: true, paymentDetails: true },
        });

        const hasCheckoutDebit = approvedNegativeSavings.some((row: any) => {
          const rowDetails = normalizeDetails(row.paymentDetails);
          return (
            rowDetails.kind === "CHECKOUT_DEBIT" &&
            rowDetails.reservationId === reservationId
          );
        });

        const debitAmountBs = roundMoney(packageGoalUsd * Number(saving.bcvRate ?? 0));

        if (!hasCheckoutDebit) {
          await tx.saving.create({
            data: {
              userId: saving.userId,
              bcvRate: Number(saving.bcvRate ?? 0),
              amountUsd: -packageGoalUsd,
              amountBs: debitAmountBs > 0 ? -debitAmountBs : 0,
              status: "APPROVED",
              paymentDetails: {
                kind: "CHECKOUT_DEBIT",
                checkoutMode: "SAVINGS",
                reservationId,
                homeId,
                homeTitle: home.title || details.homeTitle || "Paquete",
                seatId,
                seatIds,
                amountUsd: -packageGoalUsd,
                amountBs: debitAmountBs > 0 ? -debitAmountBs : 0,
                autoCreatedFromSavingApproval: true,
                sourceSavingId: saving.id,
              },
            },
          });
        }
      }

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

      if (completedReservationId) {
        void sendReservationConfirmationToGuest({
          reservationId: completedReservationId,
          fallbackBcvRate: Number(saving.bcvRate ?? 0),
        });
      }
    }

    if (saving.User?.email) {
      const details = normalizeDetails(saving.paymentDetails);
      const userName =
        (saving.User.firstName && saving.User.firstName.trim()) ||
        saving.User.email ||
        "Viajero";
      await sendSavingStatusEmail({
        userEmail: saving.User.email,
        userName,
        status: "APPROVED",
        amountUsd: Number(saving.amountUsd ?? 0),
        amountBs: Number(saving.amountBs ?? 0),
        bcvRate: Number(saving.bcvRate ?? 0),
        packageTitle:
          typeof details.homeTitle === "string" && details.homeTitle.trim()
            ? details.homeTitle.trim()
            : null,
        referenceNumber:
          typeof details.referenceNumber === "string" ? details.referenceNumber : null,
        rejectionReason: null,
        reviewedAt: new Date(),
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error en PATCH /api/admin/savings/[id]:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
