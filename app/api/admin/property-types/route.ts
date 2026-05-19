import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userRecord = await prismaAny.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (
    !userRecord ||
    (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")
  ) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const propertyTypes =
    prismaAny.property_types ?? prismaAny.propertyTypes ?? prismaAny.propertyType;

  if (!propertyTypes?.findMany) {
    return NextResponse.json([]);
  }

  const categories = await propertyTypes.findMany({
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const icon = typeof body?.icon === "string" ? body.icon.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Nombre de categoría requerido" },
        { status: 400 }
      );
    }

    const createData: { name: string; icon?: string } = { name };
    if (icon) {
      createData.icon = icon;
    }

    const propertyTypes =
      prismaAny.property_types ?? prismaAny.propertyTypes ?? prismaAny.propertyType;

    if (!propertyTypes?.create) {
      return NextResponse.json(
        { error: "Delegate de property types no disponible en este entorno" },
        { status: 500 }
      );
    }

    const createdCategory = await propertyTypes.create({
      data: createData,
    });

    return NextResponse.json(createdCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating property type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



