import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await (prisma as any).blockedDate.findUnique({
      where: { id: params.id },
      include: { Home: { select: { userId: true } } },
    });

    if (!record) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (record.Home?.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await (prisma as any).blockedDate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
