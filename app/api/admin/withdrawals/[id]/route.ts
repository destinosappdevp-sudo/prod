import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { enviarCreditoInmediato } from "@/app/lib/r4-credito";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

function normalizePaymentDetails(value: unknown): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, any>;
}

async function getAdminRole(userId: string): Promise<string | null> {
  const prismaAny = prisma as any;
  const userRecord = await prismaAny.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return userRecord?.role || null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

    const role = await getAdminRole(user.id);
    if (!role || !ADMIN_ROLES.has(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const action = body?.action; // "process" | "reject"
    const adminNotes =
      typeof body?.adminNotes === "string" ? body.adminNotes.trim() : "";

    if (!["process", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "reject" && !adminNotes) {
      return NextResponse.json(
        { error: "Debes indicar un motivo para rechazar el retiro" },
        { status: 400 },
      );
    }

    const prismaAny = prisma as any;
    const withdrawal = await prismaAny.withdrawalRequest.findUnique({
      where: { id },
      include: {
        User: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Retiro no encontrado" },
        { status: 404 },
      );
    }

    if (withdrawal.status !== "PENDING") {
      return NextResponse.json(
        { error: "Solo se pueden procesar retiros pendientes" },
        { status: 400 },
      );
    }

    const details = normalizePaymentDetails(withdrawal.paymentDetails);

    if (action === "reject") {
      const updated = await prismaAny.withdrawalRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNotes,
          processedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, withdrawal: updated });
    }

    // Procesar con R4 CreditoInmediato
    const bankCode =
      typeof details.bankName === "string" && details.bankName.trim()
        ? details.bankName.trim()
        : "";
    const cedula =
      typeof details.cedula === "string" && details.cedula.trim()
        ? details.cedula.trim()
        : "";
    const phoneNumber =
      typeof details.phoneNumber === "string" && details.phoneNumber.trim()
        ? details.phoneNumber.trim()
        : "";

    if (!bankCode || !cedula || !phoneNumber) {
      return NextResponse.json(
        { error: "Faltan datos bancarios del host para procesar el retiro" },
        { status: 400 },
      );
    }

    const result = await enviarCreditoInmediato({
      banco: bankCode,
      cedula,
      telefono: phoneNumber,
      monto: withdrawal.amount,
      concepto: `Retiro Destinos Venezuela - ${withdrawal.id.slice(0, 8)}`,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Error al procesar el retiro con R4",
          rawResponse: result.rawResponse,
        },
        { status: 502 },
      );
    }

    const updated = await prismaAny.withdrawalRequest.update({
      where: { id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
        adminNotes: `Procesado vía R4. Código: ${result.code || ""}. Ref: ${result.reference || result.operationId || ""}`,
        paymentDetails: {
          ...details,
          r4Response: result.rawResponse,
          r4Code: result.code,
          r4Reference: result.reference,
          r4OperationId: result.operationId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: updated,
      r4: result,
    });
  } catch (err) {
    console.error("[admin/withdrawals] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
