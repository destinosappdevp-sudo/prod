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

    if (!userId || !type) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
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
      select: { id: true, paymentDetails: true },
    });

    const alreadyExists = allUserSavings.some((saving: any) => {
      const details = saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? saving.paymentDetails
        : {};
      const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;

      if (type === "general") {
        return !targetHomeId;
      }

      return targetHomeId === homeId;
    });

    if (alreadyExists) {
      return NextResponse.json(
        {
          error:
            type === "general"
              ? "Ese usuario ya tiene una alcancía general"
              : "Ese usuario ya tiene una alcancía para ese paquete",
        },
        { status: 409 }
      );
    }

    let paymentDetails: Prisma.InputJsonValue = { createdByAdmin: true };

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

    const saving = await prisma.saving.create({
      data: {
        userId,
        amountBs: 0,
        amountUsd: 0,
        bcvRate: 0,
        status: "APPROVED",
        paymentDetails,
      },
    });

    return NextResponse.json({ saving });
  } catch (error) {
    console.error("Error al crear alcancía desde admin:", error);
    return NextResponse.json({ error: "Error al crear alcancía" }, { status: 500 });
  }
}
