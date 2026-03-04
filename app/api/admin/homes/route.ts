import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el usuario y verificar que sea SUPERADMIN
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Solo superadmins pueden acceder a esto" },
        { status: 403 }
      );
    }

    // Obtener alojamientos PENDING_APPROVAL
    const homes = await prisma.home.findMany({
      where: {
        publishStatus: "PENDING_APPROVAL",
      },
      select: {
        id: true,
        title: true,
        description: true,
        country: true,
        municipality: true,
        price: true,
        photo: true,
        categoryName: true,
        publishStatus: true,
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isVerified: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(homes);
  } catch (error) {
    console.error("Error fetching homes:", error);
    return NextResponse.json(
      { error: "Error al obtener alojamientos" },
      { status: 500 }
    );
  }
}
