import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // No permitir cambiar el rol del SUPERADMIN
    if (userRecord.role === "ADMIN") {
      // Los ADMIN no pueden cambiar roles de SUPERADMIN
      const { userId } = await request.json();
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (targetUser?.role === "SUPERADMIN") {
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
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
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
