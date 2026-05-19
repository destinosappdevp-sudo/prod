import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { optimizeImageForUpload } from "@/app/lib/image-upload";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/user/documents — lista los documentos del usuario autenticado
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const docs = await prisma.$queryRaw(
      Prisma.sql`SELECT id, "userId", url, "fileName", "fileSize", "mimeType", "uploadedAt" FROM "UserDocument" WHERE "userId" = ${user.id} ORDER BY "uploadedAt" DESC`
    );

    return NextResponse.json(docs);
  } catch (err) {
    console.error("Error listando documentos:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/user/documents — sube un nuevo documento
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    // Validar tipo: imagen o PDF
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use JPG, PNG, WEBP o PDF" },
        { status: 400 }
      );
    }

    // Máximo 10 MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 });
    }

    const optimizedFile = await optimizeImageForUpload(file, {
      maxWidth: 2200,
      maxHeight: 2200,
      quality: 88,
    });
    const storagePath = `verification-docs/${user.id}-${Date.now()}.${optimizedFile.extension}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from("images")
      .upload(storagePath, optimizedFile.file, {
        upsert: false,
        contentType: optimizedFile.contentType,
      });

    if (storageError) {
      console.error("Error subiendo a storage:", storageError);
      return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${storageData.path}`;

    const id = crypto.randomUUID();
    const rows = (await prisma.$queryRaw(
      Prisma.sql`INSERT INTO "UserDocument" (id, "userId", url, "fileName", "fileSize", "mimeType", "uploadedAt") VALUES (${id}, ${user.id}, ${url}, ${file.name}, ${optimizedFile.file.size}, ${optimizedFile.contentType}, NOW()) RETURNING id, "userId", url, "fileName", "fileSize", "mimeType", "uploadedAt"`
    )) as any[];
    const doc = rows[0];

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Error subiendo documento:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}



