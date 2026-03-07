import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createAdminClient } from "@/app/lib/supabase/admin";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

async function applyAmenityUpdates(homeId: string, payload?: string | null) {
  if (!payload) return;

  let amenities: { amenityId: string; status: "YES" | "NO" | "UNSPECIFIED" }[] = [];

  try {
    amenities = JSON.parse(payload);
  } catch {
    return;
  }

  if (!Array.isArray(amenities)) return;

  const toKeep = amenities.filter((item) => item.status !== "UNSPECIFIED");

  await prismaAny.$transaction(async (tx: any) => {
    // Eliminar todas las amenidades del home y re-crear solo las activas
    await tx.homeAmenity.deleteMany({ where: { homeId } });

    for (const item of toKeep) {
      await tx.homeAmenity.create({
        data: {
          id: crypto.randomUUID(),
          homeId,
          amenityId: item.amenityId,
          status: item.status,
        },
      });
    }

    await tx.home.update({
      where: { id: homeId },
      data: { addedAmenities: toKeep.length > 0 },
    });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;
    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const guests = (formData.get("guests") as string) || "";
    const bedrooms = (formData.get("bedrooms") as string) || "";
    const bathrooms = (formData.get("bathrooms") as string) || "";
    const country = (formData.get("country") as string) || "";
    const municipality = (formData.get("municipality") as string) || "";
    const exactAddress = (formData.get("exactAddress") as string) || "";
    const checkInTime = (formData.get("checkInTime") as string) || "";
    const contactNumber = (formData.get("contactNumber") as string) || "";
    const latRaw = formData.get("latitude") as string | null;
    const lngRaw = formData.get("longitude") as string | null;
    const latitude = latRaw ? parseFloat(latRaw) : null;
    const longitude = lngRaw ? parseFloat(lngRaw) : null;
    const price = (formData.get("price") as string) || "";
    const categoryName = (formData.get("categoryName") as string) || "";
    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    // Validaciones básicas
    if (!title || !country || !municipality || !price) {
      return NextResponse.json({ error: "Faltan campos obligatorios: título, país, municipio o precio" }, { status: 400 });
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "El precio debe ser un número mayor a 0" }, { status: 400 });
    }

    let photoPath: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const fileExtension = imageFile.name.split(".").pop() || "jpg";
      const uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
      const filePath = `user-${user.id}/${uniqueFileName}`;

      const storageClient = createAdminClient() ?? supabase;

      const { error: uploadError } = await storageClient.storage
        .from("images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error subiendo imagen:", uploadError.message);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }

      photoPath = filePath;
    }

    // Actualizar la propiedad
    const updated = await prisma.home.update({
      where: { id: params.id },
      data: {
        title: title || null,
        description: description || null,
        guests: guests || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        country: country || null,
        municipality: municipality || null,
        exactAddress: exactAddress || null,
        checkInTime: checkInTime || null,
        contactNumber: contactNumber || null,
        latitude: latitude,
        longitude: longitude,
        price: price ? parseInt(price) : null,
        categoryName: categoryName || null,
        ...(photoPath ? { photo: photoPath } : {}),
        // Actualizar flags de completitud
        addedCategory: !!categoryName,
        addedDescription: !!(title && description),
        addedLocation: !!(country && municipality),
      },
    });

    await applyAmenityUpdates(params.id, amenitiesPayload);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const property = await prismaAny.home.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        photo: true,
        _count: {
          select: {
            Reservation: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if ((property._count?.Reservation || 0) > 0) {
      return NextResponse.json(
        {
          error:
            "Esta propiedad ha tenido reservas y no puede ser borrada",
        },
        { status: 409 }
      );
    }

    await prismaAny.$transaction(async (tx: any) => {
      await tx.favorite.deleteMany({ where: { homeId: params.id } });
      await tx.homeAmenity.deleteMany({ where: { homeId: params.id } });
      await tx.review.deleteMany({ where: { homeId: params.id } });
      await tx.home.delete({ where: { id: params.id } });
    });

    if (property.photo) {
      const storageClient = createAdminClient() ?? supabase;
      const { error: removeError } = await storageClient.storage
        .from("images")
        .remove([property.photo]);

      if (removeError) {
        console.error("No se pudo eliminar imagen de storage:", removeError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
