import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import {
  revalidateHomeVisibilityPaths,
  syncHomeVisibilityFlags,
} from "@/app/lib/home-visibility";

export const dynamic = "force-dynamic";

type AllowedStatus = "APPROVED" | "PENDING_APPROVAL" | "DRAFT" | "REJECTED";

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

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const nextStatus = body?.publishStatus as AllowedStatus | undefined;

    if (!nextStatus || !["APPROVED", "PENDING_APPROVAL", "DRAFT", "REJECTED"].includes(nextStatus)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const property = await prisma.home.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const updated = await prisma.home.update({
      where: { id },
      data: {
        publishStatus: nextStatus,
        approvedById: nextStatus === "APPROVED" ? user.id : null,
        approvedAt: nextStatus === "APPROVED" ? new Date() : null,
      },
      select: {
        id: true,
        publishStatus: true,
        approvedAt: true,
        approvedById: true,
      },
    });

    await syncHomeVisibilityFlags(id);
    revalidateHomeVisibilityPaths(id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating property status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
