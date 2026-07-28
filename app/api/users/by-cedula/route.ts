import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

export async function GET(request: Request) {
  try {
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
      return NextResponse.json({ found: false }, { status: 200 });
    }

    return NextResponse.json({ found: true, ...targetUser });
  } catch (error) {
    console.error("Error buscando usuario por cédula:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
