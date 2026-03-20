import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { optimizeImageForUpload } from "@/app/lib/image-upload";
import {
  revalidateHomeVisibilityPaths,
  syncHomeVisibilityFlags,
} from "@/app/lib/home-visibility";

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
    const contactNumberInput = ((formData.get("contactNumber") as string) || "").trim();
    const hasLeadingPlus = contactNumberInput.startsWith("+");
    const contactDigitsOnly = contactNumberInput.replace(/\D/g, "");
    const normalizedContactNumber = `${hasLeadingPlus ? "+" : ""}${contactDigitsOnly}`.slice(0, 14);
    const latRaw = formData.get("latitude") as string | null;
    const lngRaw = formData.get("longitude") as string | null;
    const latitude = latRaw ? parseFloat(latRaw) : null;
    const longitude = lngRaw ? parseFloat(lngRaw) : null;
    const price = (formData.get("price") as string) || "";
    const categoryNameRaw = (formData.get("categoryName") as string) || "";
    const propertyTypeIdRaw = formData.get("propertyTypeId") as string;
    const propertyTypeIdsRaw = formData
      .getAll("propertyTypeIds")
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    const selectedTypeIds = Array.from(
      new Set(
        [...propertyTypeIdsRaw, propertyTypeIdRaw]
          .map((value) => parseInt(value, 10))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    ) as number[];

    let selectedCategories: Array<{ id: number; name: string }> = [];

    if (selectedTypeIds.length > 0) {
      const categoriesFromIds = (await prismaAny.property_types.findMany({
        where: { id: { in: selectedTypeIds } },
        select: { id: true, name: true },
      })) as Array<{ id: number; name: string }>;

      const categoryById = new Map(
        categoriesFromIds.map((category) => [category.id, category])
      );

      selectedCategories = selectedTypeIds
        .map((typeId) => categoryById.get(typeId))
        .filter((category): category is { id: number; name: string } => !!category);
    }

    if (selectedCategories.length === 0 && categoryNameRaw) {
      const requestedNames = Array.from(
        new Set(
          categoryNameRaw
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean)
        )
      );

      if (requestedNames.length > 0) {
        const categoriesFromNames = (await prismaAny.property_types.findMany({
          where: { name: { in: requestedNames } },
          select: { id: true, name: true },
        })) as Array<{ id: number; name: string }>;

        const categoryByName = new Map(
          categoriesFromNames.map((category) => [category.name, category])
        );

        selectedCategories = requestedNames
          .map((name) => categoryByName.get(name))
          .filter((category): category is { id: number; name: string } => !!category);
      }
    }

    const selectedCategoryNames = selectedCategories.map((category) => category.name);
    const selectedPropertyTypeIds = selectedCategories.map((category) => category.id);

    if (!/^\+?\d{7,14}$/.test(normalizedContactNumber)) {
      return NextResponse.json(
        {
          error:
            "El número de contacto es obligatorio y debe contener solo números (puede iniciar con +) con 7 a 14 caracteres",
        },
        { status: 400 }
      );
    }

    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    let photoPath: string | undefined;
    if (imageFile && imageFile.size > 0) {
      const optimizedImage = await optimizeImageForUpload(imageFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 82,
      });
      const uniqueFileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${optimizedImage.extension}`;
      const filePath = `user-${user.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, optimizedImage.file, {
          cacheControl: "3600",
          contentType: optimizedImage.contentType,
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

    const baseUpdateData = {
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
      contactNumber: normalizedContactNumber,
      price: price ? parseInt(price) : null,
      ...(photoPath ? { photo: photoPath } : {}),
      addedDescription: !!(title && description),
      addedLocation: !!(country && municipality),
    };

    const updated = await prisma.home.update({
      where: { id: params.id },
      data: {
        ...baseUpdateData,
        categoryName: selectedCategoryNames,
        propertyTypeId: selectedPropertyTypeIds,
        addedCategory: selectedCategoryNames.length > 0,
      },
    });

    await applyAmenityUpdates(params.id, amenitiesPayload);
    await syncHomeVisibilityFlags(params.id);
    revalidateHomeVisibilityPaths(params.id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
