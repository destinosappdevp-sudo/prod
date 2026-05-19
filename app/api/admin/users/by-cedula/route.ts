import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
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
      ((userRecord as any).role !== "ADMIN" && (userRecord as any).role !== "SUPERADMIN")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cedula = normalizeCedulaValue(searchParams.get("cedula"));

    if (!cedula) {
      return NextResponse.json({ error: "Debes indicar una cédula" }, { status: 400 });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        cedula: {
          equals: cedula,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        cedula: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error("Error buscando usuario por cédula:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



