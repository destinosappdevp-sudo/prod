import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const prismaAny = prisma as any;
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || ((userRecord as any).role !== "ADMIN" && (userRecord as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // No permitir cambiar el rol del SUPERADMIN
    if ((userRecord as any).role === "ADMIN") {
      // Los ADMIN no pueden cambiar roles de SUPERADMIN
      const { userId } = await request.json();
      const targetUser = await prismaAny.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if ((targetUser as any)?.role === "SUPERADMIN") {
        return NextResponse.json(
          { error: "No puedes cambiar el rol del SUPERADMIN" },
          { status: 403 }
        );
      }
    }

    const { userId, newRole } = await request.json();

    // Validar que el rol sea válido
    const validRoles = ["GUEST", "HOST", "ADMIN", "SUPERADMIN"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Actualizar el rol
    const updated = await prismaAny.user.update({
      where: { id: userId },
      data: { role: newRole } as any,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
