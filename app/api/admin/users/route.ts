import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || ((userRecord as any).role !== "ADMIN" && (userRecord as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Obtener todos los usuarios con sus estadísticas
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            Home: true,
            Favorite: true,
            Reservation: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
