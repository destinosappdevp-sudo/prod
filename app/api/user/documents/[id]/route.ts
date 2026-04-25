import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// DELETE /api/user/documents/[id] — elimina un documento del usuario autenticado
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rows = (await prisma.$queryRaw(
      Prisma.sql`SELECT id, "userId" FROM "UserDocument" WHERE id = ${params.id} LIMIT 1`
    )) as any[];
    const doc = rows[0] ?? null;

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    // Solo el propietario puede eliminar su documento
    if (doc.userId !== user.id) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM "UserDocument" WHERE id = ${params.id}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando documento:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
