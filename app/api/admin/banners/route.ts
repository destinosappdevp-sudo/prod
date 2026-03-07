import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { normalizeExternalUrl } from "@/lib/utils";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar rol (BANNER o SUPERADMIN)
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !userRecord ||
      (userRecord.role !== "BANER" && userRecord.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para crear banners" },
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
    const image = formData.get("image") as File;
    const existingImageUrl = formData.get("existingImageUrl") as string;
    const createdById = formData.get("createdById") as string;
    const tipo = (formData.get("tipo") as string) || "HERO1";
    const normalizedUrl = normalizeExternalUrl(url);

    // Validaciones básicas
    if (!title || !startDate || !endDate || !createdById) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Debe tener imagen nueva o existente
    if (!image && !existingImageUrl) {
      return NextResponse.json(
        { error: "Debes proporcionar una imagen" },
        { status: 400 }
      );
    }

    // Verificar que el createdById coincida con el usuario autenticado
    if (createdById !== user.id) {
      return NextResponse.json(
        { error: "ID de usuario no coincide" },
        { status: 403 }
      );
    }

    let imageUrl = existingImageUrl;

    // Subir imagen nueva si se proporcionó
    if (image && image.size > 0) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
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
    }

    const banner = await prisma.banner.create({
      data: {
        id: randomUUID(),
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        url: normalizedUrl,
        clientPhone: clientPhone || "",
        clientEmail: clientEmail || "",
        cost: cost ? parseFloat(cost) : 0,
        imageUrl,
        tipo: tipo as any,
        createdById,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creando banner:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
