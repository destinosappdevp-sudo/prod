import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes adjuntar una imagen de la captura del pago" },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "El archivo adjunto está vacío" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "La captura no puede superar 8MB" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes para la captura" },
        { status: 400 }
      );
    }

    const { optimizeImageForUpload } = await import("@/app/lib/image-upload");
    const optimizedImage = await optimizeImageForUpload(file, {
      maxWidth: 2200,
      maxHeight: 2200,
      quality: 85,
    });

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${optimizedImage.extension}`;
    const filePath = `payments/${user.id}/${uniqueFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, optimizedImage.file, {
        cacheControl: "3600",
        contentType: optimizedImage.contentType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "No se pudo subir la captura del pago" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json(
        { error: "No se pudo obtener la URL de la captura" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    return NextResponse.json(
      { error: "Error interno al subir la captura" },
      { status: 500 }
    );
  }
}
