import { NextResponse } from "next/server";
import Papa from "papaparse";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function yesNo(value: boolean | null | undefined): string {
  return value ? "Si" : "No";
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        firstName: true,
        email: true,
        cedula: true,
        dateOfBirth: true,
        phoneNumber: true,
        emergencyPhone: true,
        address: true,
        travelsWithChildren: true,
        childrenAges: true,
        healthConditions: true,
        hasTraveledWithDestinos: true,
        lastTravelDestination: true,
      },
      orderBy: { email: "asc" },
    });

    const rows = users.map((u) => ({
      "Nombre y Apellido": u.firstName || "",
      "Correo electrónico": u.email || "",
      "Numero de Cedula": u.cedula || "",
      "Fecha de Nacimiento": formatDate(u.dateOfBirth),
      "Numero de Teléfono": u.phoneNumber || "",
      "Teléfono Opcional": u.emergencyPhone || "",
      "Dirección de Habitación": u.address || "",
      "Viaja con Niños? De ser Correcto Indique su edad":
        u.travelsWithChildren
          ? `${yesNo(u.travelsWithChildren)}${u.childrenAges ? `, ${u.childrenAges}` : ""}`
          : yesNo(u.travelsWithChildren),
      "padece alguna enfermedad o lesión? de ser correcto especifique": u.healthConditions || "",
      "ha Viajado con Destino's Venezuela? de ser correcto especifique cual destino...":
        u.hasTraveledWithDestinos
          ? `${yesNo(u.hasTraveledWithDestinos)}${u.lastTravelDestination ? `, ${u.lastTravelDestination}` : ""}`
          : yesNo(u.hasTraveledWithDestinos),
    }));

    const csv = Papa.unparse(rows, { quotes: true });
    const csvWithBom = `\uFEFF${csv}`;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="usuarios.csv"',
      },
    });
  } catch (e) {
    console.error("Error exportando usuarios CSV:", e);
    return NextResponse.json({ error: "Error exportando usuarios" }, { status: 500 });
  }
}
