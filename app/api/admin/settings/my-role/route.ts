import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

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

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ role: userRecord.role });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
