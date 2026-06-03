import { NextRequest, NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!currentUser || ((currentUser as any).role !== "ADMIN" && (currentUser as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN no configurado" },
        { status: 500 }
      );
    }

    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "200");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(1000, limitParam)) : 200;

    const result = await list({
      token,
      prefix: "audit-logs/savings/",
      limit,
    });

    // Ordenar por fecha de subida descendente para ver más reciente primero.
    const blobs = [...result.blobs].sort((a, b) => {
      const ta = new Date(a.uploadedAt || 0).getTime();
      const tb = new Date(b.uploadedAt || 0).getTime();
      return tb - ta;
    });

    return NextResponse.json({
      count: blobs.length,
      hasMore: result.hasMore,
      cursor: result.cursor || null,
      blobs: blobs.map((blob) => ({
        pathname: blob.pathname,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
        url: blob.url,
      })),
    });
  } catch (err) {
    console.error("Error listando audit logs de savings:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
