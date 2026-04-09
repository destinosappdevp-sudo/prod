import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_ROLES = new Set(["GUEST", "ADMIN", "SUPERADMIN"]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaAny = prisma as any;
    const requester = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!requester || (requester.role !== "ADMIN" && requester.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId : "";
    const newRole = typeof body?.newRole === "string" ? body.newRole : "";

    if (!userId || !newRole) {
      return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 });
    }

    if (!VALID_ROLES.has(newRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const targetUser = await prismaAny.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ningún perfil administrativo puede cambiar el rol del superadmin actual.
    if (targetUser.role === "SUPERADMIN") {
      return NextResponse.json(
        { error: "No puedes cambiar el rol del SUPERADMIN" },
        { status: 403 }
      );
    }

    // Un ADMIN no puede promover a SUPERADMIN.
    if (requester.role === "ADMIN" && newRole === "SUPERADMIN") {
      return NextResponse.json(
        { error: "No tienes permisos para asignar SUPERADMIN" },
        { status: 403 }
      );
    }

    const updated = await prismaAny.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        role: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
