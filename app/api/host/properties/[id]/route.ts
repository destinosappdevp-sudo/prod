import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

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

    const home = await prisma.home.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!home || home.userId !== user.id) {
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
    const categoryNameRaw = (formData.get("categoryName") as string) || "";
    const propertyTypeIdRaw = formData.get("propertyTypeId") as string;
    const propertyTypeId = propertyTypeIdRaw
      ? parseInt(propertyTypeIdRaw, 10)
      : null;
    let categoryName = categoryNameRaw;

    if (!categoryName && propertyTypeId) {
      const propertyType = await prismaAny.property_types.findUnique({
        where: { id: propertyTypeId },
        select: { name: true },
      });
      categoryName = propertyType?.name || "";
    }

    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    let photoPath: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const fileExtension = imageFile.name.split(".").pop() || "jpg";
      const uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExtension}`;
      const filePath = `user-${user.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
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

    const updateData = {
      title: title || null,
      description: description || null,
      guests: guests || null,
      bedrooms: bedrooms || null,
      bathrooms: bathrooms || null,
      country: country || null,
      municipality: municipality || null,
      exactAddress: exactAddress || null,
      latitude: latitude,
      longitude: longitude,
      checkInTime: checkInTime || null,
      contactNumber: contactNumber || null,
      price: price ? parseInt(price) : null,
      categoryName: categoryName || null,
      propertyTypeId: propertyTypeId,
      ...(photoPath ? { photo: photoPath } : {}),
      addedCategory: !!categoryName,
      addedDescription: !!(title && description),
      addedLocation: !!(country && municipality),
    };

    const updated = await prisma.home.update({
      where: { id: params.id },
      data: updateData as never,
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
