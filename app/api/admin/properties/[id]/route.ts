import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getAdminStorageClientOrThrow } from "@/app/lib/supabase/admin";
import { optimizeImageForUpload } from "@/app/lib/image-upload";
import {
  revalidateHomeVisibilityPaths,
  syncHomeVisibilityFlags,
} from "@/app/lib/home-visibility";
import { syncPackageSeats } from "@/app/lib/syncPackageSeats";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

function parseSeatInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Internal server error";
}

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const priceVipRaw = (formData.get("priceVip") as string) || "";
    const vipSeatsRaw = (formData.get("vipSeats") as string) || "";
    const standardSeatsRaw = (formData.get("standardSeats") as string) || "";
    // Zona VIP = bedrooms, Zona Estándar = bathrooms; se usa el valor explícito de cupos cuando viene en payload
    const vipSeats = parseSeatInput(vipSeatsRaw);
    const standardSeats = parseSeatInput(standardSeatsRaw);
    const bedroomsInt = parseSeatInput(bedrooms);
    const bathroomsInt = parseSeatInput(bathrooms);
    const effectiveVipSeats = vipSeats ?? bedroomsInt ?? 0;
    const effectiveStandardSeats = standardSeats ?? bathroomsInt ?? 0;
    const categoryNameRaw = (formData.get("categoryName") as string) || "";
    const propertyTypeIdRaw = (formData.get("propertyTypeId") as string) || "";
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

    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    // Validaciones básicas
    if (!title || !country || !municipality || !price) {
      return NextResponse.json({ error: "Faltan campos obligatorios: título, país, municipio o precio" }, { status: 400 });
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "El precio debe ser un número mayor a 0" }, { status: 400 });
    }
    if (effectiveVipSeats % 2 !== 0 || effectiveStandardSeats % 2 !== 0) {
      return NextResponse.json(
        { error: "Los cupos VIP y Estándar deben ser números pares" },
        { status: 400 }
      );
    }

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

      const storageClient = await getAdminStorageClientOrThrow(
        "images",
        "admin properties PATCH"
      );

      const { error: uploadError } = await storageClient.storage
        .from("images")
        .upload(filePath, optimizedImage.file, {
          cacheControl: "3600",
          contentType: optimizedImage.contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error subiendo imagen:", {
          code: uploadError.name,
          message: uploadError.message,
        });
        return NextResponse.json(
          { error: `No se pudo subir la imagen: ${uploadError.message}` },
          { status: 500 }
        );
      }

      photoPath = filePath;
    }

    const baseUpdateData = {
      title: title || null,
      description: description || null,
      guests: (effectiveVipSeats + effectiveStandardSeats).toString(),
      bedrooms: effectiveVipSeats.toString(),
      bathrooms: effectiveStandardSeats.toString(),
      country: country || null,
      municipality: municipality || null,
      exactAddress: exactAddress || null,
      checkInTime: checkInTime || null,
      contactNumber: normalizedContactNumber,
      latitude: latitude,
      longitude: longitude,
      price: price ? parseInt(price) : null,
      priceVip: priceVipRaw ? parseInt(priceVipRaw) : null,
      ...(photoPath ? { photo: photoPath } : {}),
      addedDescription: !!(title && description),
      addedLocation: !!(country && municipality),
    };

    const updated = await prisma.home.update({
      where: { id },
      data: {
        ...baseUpdateData,
        categoryName: selectedCategoryNames,
        propertyTypeId: selectedPropertyTypeIds,
        addedCategory: selectedCategoryNames.length > 0,
      },
    });

    await applyAmenityUpdates(id, amenitiesPayload);

    // Regenerar asientos si cambiaron los cupos
    await prismaAny.$transaction(async (tx: any) => {
      await syncPackageSeats(tx, id, effectiveVipSeats, effectiveStandardSeats);
    });

    await syncHomeVisibilityFlags(id);
    revalidateHomeVisibilityPaths(id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      where: { id },
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
      await tx.favorite.deleteMany({ where: { homeId: id } });
      await tx.homeAmenity.deleteMany({ where: { homeId: id } });
      await tx.review.deleteMany({ where: { homeId: id } });
      await tx.home.delete({ where: { id } });
    });

    if (property.photo) {
      const storageClient = await getAdminStorageClientOrThrow(
        "images",
        "admin properties DELETE"
      );
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
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
