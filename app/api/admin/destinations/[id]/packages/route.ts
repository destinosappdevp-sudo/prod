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

export async function POST(
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

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const destination = await prismaAny.destination.findUnique({
      where: { id },
    });

    if (!destination) {
      return NextResponse.json({ error: "Destino no encontrado" }, { status: 404 });
    }

    const formData = (await request.formData()) as unknown as globalThis.FormData;

    // Override: si el campo viene en el formulario se usa, si no se hereda del destino
    const title = (formData.get("title") as string) || destination.title || "";
    const description = (formData.get("description") as string) || destination.description || "";
    const country = (formData.get("country") as string) || destination.country || "";
    const municipality = (formData.get("municipality") as string) || destination.municipality || "";
    const exactAddress = (formData.get("exactAddress") as string) || destination.exactAddress || "";
    const checkInTime = (formData.get("checkInTime") as string) || destination.checkInTime || "";
    const contactNumberInput = ((formData.get("contactNumber") as string) || destination.contactNumber || "").trim();
    const hasLeadingPlus = contactNumberInput.startsWith("+");
    const contactDigitsOnly = contactNumberInput.replace(/\D/g, "");
    const normalizedContactNumber = `${hasLeadingPlus ? "+" : ""}${contactDigitsOnly}`.slice(0, 14);
    const latRaw = (formData.get("latitude") as string) || (destination.latitude ? String(destination.latitude) : null);
    const lngRaw = (formData.get("longitude") as string) || (destination.longitude ? String(destination.longitude) : null);
    const latitude = latRaw ? parseFloat(latRaw) : null;
    const longitude = lngRaw ? parseFloat(lngRaw) : null;
    const price = (formData.get("price") as string) || (destination.price ? String(destination.price) : "");
    const priceVipRaw = (formData.get("priceVip") as string) || (destination.priceVip ? String(destination.priceVip) : "");
    const vipSeatsRaw = (formData.get("vipSeats") as string) || (destination.vipSeats ? String(destination.vipSeats) : "");
    const standardSeatsRaw = (formData.get("standardSeats") as string) || (destination.standardSeats ? String(destination.standardSeats) : "");
    const categoryNameRaw = (formData.get("categoryName") as string) || destination.categoryName?.join(",") || "";
    const propertyTypeIdsRaw = formData
      .getAll("propertyTypeIds")
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);

    const vipSeats = parseSeatInput(vipSeatsRaw) ?? 0;
    const standardSeats = parseSeatInput(standardSeatsRaw) ?? 0;
    const effectiveGuests = (vipSeats + standardSeats).toString();

    const selectedTypeIds = Array.from(
      new Set(
        propertyTypeIdsRaw
          .map((v) => parseInt(v, 10))
          .filter((v) => Number.isInteger(v) && v > 0)
      )
    ) as number[];

    let selectedCategoryNames: string[] = destination.categoryName || [];
    let selectedPropertyTypeIds: number[] = destination.propertyTypeId || [];

    if (selectedTypeIds.length > 0) {
      const propertyTypes = prismaAny.property_types;
      if (propertyTypes) {
        const cats = (await propertyTypes.findMany({
          where: { id: { in: selectedTypeIds } },
          select: { id: true, name: true },
        })) as Array<{ id: number; name: string }>;
        const byId = new Map(cats.map((c) => [c.id, c]));
        const matched = selectedTypeIds.map((id) => byId.get(id)).filter(Boolean) as Array<{ id: number; name: string }>;
        selectedCategoryNames = matched.map((c) => c.name);
        selectedPropertyTypeIds = matched.map((c) => c.id);
      }
    } else if (categoryNameRaw) {
      const names = Array.from(new Set(categoryNameRaw.split(",").map((n: string) => n.trim()).filter(Boolean)));
      if (names.length > 0) {
        selectedCategoryNames = names as string[];
      }
    }

    if (!title || !country || !municipality) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: título, estado o municipio" },
        { status: 400 }
      );
    }

    if (vipSeats <= 0 && standardSeats <= 0) {
      return NextResponse.json(
        { error: "Debes configurar cupos en VIP, Estándar o ambos" },
        { status: 400 }
      );
    }

    if (standardSeats > 0 && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      return NextResponse.json(
        { error: "Si configuras cupos Estándar debes indicar un precio Estándar mayor a 0" },
        { status: 400 }
      );
    }

    if (vipSeats > 0 && (!priceVipRaw || isNaN(Number(priceVipRaw)) || Number(priceVipRaw) <= 0)) {
      return NextResponse.json(
        { error: "Si configuras cupos VIP debes indicar un precio VIP mayor a 0" },
        { status: 400 }
      );
    }



    const amenitiesPayload = formData.get("amenities") as string | null;
    const imageFile = formData.get("image") as File | null;

    let photoPath: string | null = destination.photo;
    if (imageFile && imageFile.size > 0) {
      const optimized = await optimizeImageForUpload(imageFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 82,
      });
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${optimized.extension}`;
      const filePath = `user-${user.id}/${uniqueFileName}`;
      const storageClient = await getAdminStorageClientOrThrow("images", "admin destinations packages POST");
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

    const created = await prismaAny.home.create({
      data: {
        id: newId,
        userId: user.id,
        destinationId: destination.id,
        title: title || null,
        description: description || null,
        guests: effectiveGuests,
        bedrooms: vipSeats.toString(),
        bathrooms: standardSeats.toString(),
        country: country || null,
        municipality: municipality || null,
        exactAddress: exactAddress || null,
        checkInTime: checkInTime || null,
        contactNumber: normalizedContactNumber || null,
        latitude,
        longitude,
        price: standardSeats > 0 ? parseInt(price) : null,
        priceVip: vipSeats > 0 ? parseInt(priceVipRaw) : null,
        vipSeats,
        standardSeats,
        photo: photoPath,
        categoryName: selectedCategoryNames,
        propertyTypeId: selectedPropertyTypeIds,
        addedCategory: selectedCategoryNames.length > 0,
        addedDescription: !!(title && description),
        addedLocation: !!(country && municipality),
        publishStatus: "APPROVED",
      },
    });

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

    if (vipSeats > 0 || standardSeats > 0) {
      await prismaAny.$transaction(async (tx: any) => {
        await syncPackageSeats(tx, newId, vipSeats, standardSeats);
      });
    }

    await syncHomeVisibilityFlags(newId);
    revalidateHomeVisibilityPaths(newId);

    return NextResponse.json({ id: newId, ...created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/destinations/[id]/packages error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
