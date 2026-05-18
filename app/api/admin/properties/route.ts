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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const vipSeatsRaw = (formData.get("vipSeats") as string) || "";
    const standardSeatsRaw = (formData.get("standardSeats") as string) || "";
    // Zona VIP = bedrooms, Zona Estándar = bathrooms; se usa el valor explícito de cupos cuando viene en payload
    const vipSeats = parseSeatInput(vipSeatsRaw);
    const standardSeats = parseSeatInput(standardSeatsRaw);
    const bedroomsInt = parseSeatInput(bedrooms);
    const bathroomsInt = parseSeatInput(bathrooms);
    const effectiveVipSeats = vipSeats ?? bedroomsInt ?? 0;
    const effectiveStandardSeats = standardSeats ?? bathroomsInt ?? 0;
    const effectiveGuests = (effectiveVipSeats + effectiveStandardSeats).toString();
    const categoryNameRaw = (formData.get("categoryName") as string) || "";
    const propertyTypeIdRaw = (formData.get("propertyTypeId") as string) || "";
    const propertyTypeIdsRaw = formData
      .getAll("propertyTypeIds")
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);

    const selectedTypeIds = Array.from(
      new Set(
        [...propertyTypeIdsRaw, propertyTypeIdRaw]
          .map((v) => parseInt(v, 10))
          .filter((v) => Number.isInteger(v) && v > 0)
      )
    ) as number[];

    let selectedCategories: Array<{ id: number; name: string }> = [];

    if (selectedTypeIds.length > 0) {
      const cats = (await prismaAny.property_types.findMany({
        where: { id: { in: selectedTypeIds } },
        select: { id: true, name: true },
      })) as Array<{ id: number; name: string }>;
      const byId = new Map(cats.map((c) => [c.id, c]));
      selectedCategories = selectedTypeIds.map((id) => byId.get(id)).filter((c): c is { id: number; name: string } => !!c);
    }

    if (selectedCategories.length === 0 && categoryNameRaw) {
      const names = Array.from(new Set(categoryNameRaw.split(",").map((n) => n.trim()).filter(Boolean)));
      if (names.length > 0) {
        const cats = (await prismaAny.property_types.findMany({
          where: { name: { in: names } },
          select: { id: true, name: true },
        })) as Array<{ id: number; name: string }>;
        const byName = new Map(cats.map((c) => [c.name, c]));
        selectedCategories = names.map((n) => byName.get(n)).filter((c): c is { id: number; name: string } => !!c);
      }
    }

    if (!title || !country || !municipality || !price) {
      return NextResponse.json({ error: "Faltan campos obligatorios: título, estado, municipio o precio" }, { status: 400 });
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

    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    let photoPath: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const optimized = await optimizeImageForUpload(imageFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 82,
      });
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${optimized.extension}`;
      const filePath = `user-${user.id}/${uniqueFileName}`;
      const storageClient = await getAdminStorageClientOrThrow(
        "images",
        "admin properties POST"
      );
      const { error: uploadError } = await storageClient.storage
        .from("images")
        .upload(filePath, optimized.file, {
          cacheControl: "3600",
          contentType: optimized.contentType,
          upsert: false,
        });
      if (uploadError) {
        return NextResponse.json(
          { error: `No se pudo subir la imagen: ${uploadError.message}` },
          { status: 500 }
        );
      }
      photoPath = filePath;
    }

    const newId = crypto.randomUUID();
    const selectedCategoryNames = selectedCategories.map((c) => c.name);
    const selectedPropertyTypeIds = selectedCategories.map((c) => c.id);

    const created = await prismaAny.home.create({
      data: {
        id: newId,
        userId: user.id,
        title: title || null,
        description: description || null,
        guests: effectiveGuests,
        bedrooms: effectiveVipSeats.toString(),
        bathrooms: effectiveStandardSeats.toString(),
        country: country || null,
        municipality: municipality || null,
        exactAddress: exactAddress || null,
        checkInTime: checkInTime || null,
        contactNumber: normalizedContactNumber || null,
        latitude,
        longitude,
        price: price ? parseInt(price) : null,
        vipSeats: effectiveVipSeats,
        standardSeats: effectiveStandardSeats,
        photo: photoPath,
        categoryName: selectedCategoryNames,
        propertyTypeId: selectedPropertyTypeIds,
        addedCategory: selectedCategoryNames.length > 0,
        addedDescription: !!(title && description),
        addedLocation: !!(country && municipality),
        publishStatus: "PENDING_APPROVAL",
      },
    });

    // Aplicar amenidades si las hay
    if (amenitiesPayload) {
      try {
        const amenities: { amenityId: string; status: "YES" | "NO" | "UNSPECIFIED" }[] = JSON.parse(amenitiesPayload);
        const toKeep = amenities.filter((a) => a.status !== "UNSPECIFIED");
        await prismaAny.$transaction(async (tx: any) => {
          for (const item of toKeep) {
            await tx.homeAmenity.create({
              data: {
                id: crypto.randomUUID(),
                homeId: newId,
                amenityId: item.amenityId,
                status: item.status,
              },
            });
          }
          if (toKeep.length > 0) {
            await tx.home.update({ where: { id: newId }, data: { addedAmenities: true } });
          }
        });
      } catch {
        // ignore amenity errors
      }
    }

    // Generar asientos si se configuraron cupos
    if (effectiveVipSeats > 0 || effectiveStandardSeats > 0) {
      await prismaAny.$transaction(async (tx: any) => {
        await syncPackageSeats(tx, newId, effectiveVipSeats, effectiveStandardSeats);
      });
    }

    await syncHomeVisibilityFlags(newId);
    revalidateHomeVisibilityPaths(newId);

    return NextResponse.json({ id: newId, ...created });
  } catch (error) {
    console.error("Error creating property:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
