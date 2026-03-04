import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

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

  const categories = await prismaAny.amenityCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = body?.name?.trim();
    const order = body?.order ?? null;

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const category = await prismaAny.amenityCategory.create({
      data: {
        name,
        order: typeof order === "number" ? order : null,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
