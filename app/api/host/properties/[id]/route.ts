import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
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

    const formData = await request.formData();
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
    const price = (formData.get("price") as string) || "";
    const categoryName = (formData.get("categoryName") as string) || "";
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
      checkInTime: checkInTime || null,
      contactNumber: contactNumber || null,
      price: price ? parseInt(price) : null,
      categoryName: categoryName || null,
      ...(photoPath ? { photo: photoPath } : {}),
      addedCategory: !!categoryName,
      addedDescription: !!(title && description),
      addedLocation: !!(country && municipality),
    };

    const updated = await prisma.home.update({
      where: { id: params.id },
      data: updateData as never,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
