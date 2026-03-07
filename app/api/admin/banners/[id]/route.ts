import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { normalizeExternalUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      (userRecord.role !== "BANER" && userRecord.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "No tienes permisos" },
        { status: 403 }
      );
    }

    const formData = (await req.formData()) as unknown as globalThis.FormData;
    const title = formData.get("title") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const url = formData.get("url") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const clientEmail = formData.get("clientEmail") as string;
    const cost = formData.get("cost") as string;
    const image = formData.get("image") as File | null;
    const existingImageUrl = formData.get("existingImageUrl") as string;
    const tipo = formData.get("tipo") as string | null;
    const normalizedUrl = normalizeExternalUrl(url);

    // Validar que el banner existe
    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id },
    });

    if (!existingBanner) {
      return NextResponse.json(
        { error: "Banner no encontrado" },
        { status: 404 }
      );
    }

    let imageUrl = existingBanner.imageUrl;
    let shouldDeleteOldImage = false;

    // Si hay una imagen existente seleccionada
    if (existingImageUrl) {
      imageUrl = existingImageUrl;
    }
    // Si hay nueva imagen, subirla
    else if (image && image.size > 0) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(fileName, image, { contentType: image.type });

      if (error) {
        console.error("Error subiendo imagen:", error);
        return NextResponse.json(
          { error: `Error subiendo imagen: ${error.message}` },
          { status: 500 }
        );
      }

      imageUrl = supabase.storage
        .from("images")
        .getPublicUrl(fileName).data.publicUrl;
      
      shouldDeleteOldImage = true;
    }

    // Eliminar imagen antigua si se subió una nueva
    if (shouldDeleteOldImage) {
      const oldFileName = existingBanner.imageUrl.split("/").pop();
      if (oldFileName) {
        await supabase.storage.from("images").remove([oldFileName]);
      }
    }

    const updatedBanner = await prisma.banner.update({
      where: { id: params.id },
      data: {
        title: title || existingBanner.title,
        startDate: startDate ? new Date(startDate) : existingBanner.startDate,
        endDate: endDate ? new Date(endDate) : existingBanner.endDate,
        url: normalizedUrl,
        clientPhone: clientPhone || "",
        clientEmail: clientEmail || "",
        cost: cost ? parseFloat(cost) : existingBanner.cost,
        imageUrl,
        ...(tipo ? { tipo: tipo as any } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("Error actualizando banner:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar rol
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      (userRecord.role !== "BANER" && userRecord.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "No tienes permisos" },
        { status: 403 }
      );
    }

    // Verificar que existe
    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
    });

    if (!banner) {
      return NextResponse.json(
        { error: "Banner no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar imagen de storage
    const fileName = banner.imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("images").remove([fileName]);
    }

    // Eliminar banner de BD
    await prisma.banner.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Banner eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando banner:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
