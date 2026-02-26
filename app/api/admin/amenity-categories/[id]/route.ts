import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

async function requireAdmin() {
  const supabase = createClient();
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    const updated = await prismaAny.amenityCategory.update({
      where: { id: params.id },
      data: {
        name: body?.name?.trim(),
        order: typeof body?.order === "number" ? body.order : undefined,
        isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
      },
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
