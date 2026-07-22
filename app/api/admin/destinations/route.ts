import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { getAdminStorageClientOrThrow } from "@/app/lib/supabase/admin";
import { optimizeImageForUpload } from "@/app/lib/image-upload";

export const dynamic = "force-dynamic";

const prismaAny = prisma as any;

function getPropertyTypesDelegate() {
  const delegate =
    prismaAny.property_types ?? prismaAny.propertyTypes ?? prismaAny.propertyType;
  if (delegate && typeof delegate.findMany === "function") {
    return delegate;
  }
  return null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Internal server error";
}

function slugify(text: string) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function formatDate(date: Date) {
  const d = new Date(date);
  const year = d.getFullYear().toString().slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function generateUniqueSlug(title: string) {
  const base = `${slugify(title)}-${formatDate(new Date())}`;
  let slug = base;
  let counter = 2;
  while (await prismaAny.destination.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
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
    const subtitle = (formData.get("subtitle") as string) || "";
    const description = (formData.get("description") as string) || "";
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
    const propertyTypes = getPropertyTypesDelegate();

    if (selectedTypeIds.length > 0 && propertyTypes) {
      const cats = (await propertyTypes.findMany({
        where: { id: { in: selectedTypeIds } },
        select: { id: true, name: true },
      })) as Array<{ id: number; name: string }>;
      const byId = new Map(cats.map((c) => [c.id, c]));
      selectedCategories = selectedTypeIds
        .map((id) => byId.get(id))
        .filter((c): c is { id: number; name: string } => !!c);
    }

    if (selectedCategories.length === 0 && categoryNameRaw) {
      const names = Array.from(new Set(categoryNameRaw.split(",").map((n) => n.trim()).filter(Boolean)));
      if (names.length > 0 && propertyTypes) {
        const cats = (await propertyTypes.findMany({
          where: { name: { in: names } },
          select: { id: true, name: true },
        })) as Array<{ id: number; name: string }>;
        const byName = new Map(cats.map((c) => [c.name, c]));
        selectedCategories = names
          .map((n) => byName.get(n))
          .filter((c): c is { id: number; name: string } => !!c);
      }
    }

    if (!title || !country || !municipality) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: título, estado o municipio" },
        { status: 400 }
      );
    }

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
      const storageClient = await getAdminStorageClientOrThrow("images", "admin destinations POST");
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

    const slug = await generateUniqueSlug(title);

    const destination = await prismaAny.destination.create({
      data: {
        title,
        subtitle: subtitle || null,
        slug,
        description: description || null,
        photo: photoPath,
        country,
        municipality,
        exactAddress: exactAddress || null,
        contactNumber: normalizedContactNumber || null,
        checkInTime: checkInTime || null,
        latitude,
        longitude,
        price: price ? parseInt(price, 10) : null,
        priceVip: priceVipRaw ? parseInt(priceVipRaw, 10) : null,
        vipSeats: vipSeatsRaw ? parseInt(vipSeatsRaw, 10) : null,
        standardSeats: standardSeatsRaw ? parseInt(standardSeatsRaw, 10) : null,
        categoryName: selectedCategories.map((c) => c.name),
        propertyTypeId: selectedCategories.map((c) => c.id),
        publishStatus: "APPROVED",
        userId: user.id,
      },
    });

    return NextResponse.json(destination, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/destinations error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
