import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userRecord = await prismaAny.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const amenities = await prismaAny.amenity.findMany({
    include: {
      category: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(amenities);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const iconKey = body?.iconKey?.trim();
    const iconUrl = body?.iconUrl?.trim();
    const categoryId = body?.categoryId || null;

    if (!name || !iconKey) {
      return NextResponse.json({ error: "Nombre e icono requeridos" }, { status: 400 });
    }

    const amenity = await prismaAny.amenity.create({
      data: {
        name,
        iconKey,
        iconUrl: iconUrl || null,
        categoryId,
      },
    });

    return NextResponse.json(amenity);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
