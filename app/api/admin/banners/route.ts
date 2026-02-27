import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase";

export async function GET() {
  const banners = await prisma.banner.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = formData.get("title") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const url = formData.get("url") as string;
  const clientPhone = formData.get("clientPhone") as string;
  const clientEmail = formData.get("clientEmail") as string;
  const cost = formData.get("cost") as string;
  const image = formData.get("image") as File;
  const createdById = formData.get("createdById") as string;

  // Subir imagen a Supabase Storage
  const supabase = createClient();
  const fileExt = image.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("banners")
    .upload(fileName, image, { contentType: image.type });
  if (error) {
    return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
  }
  const imageUrl = supabase.storage.from("banners").getPublicUrl(fileName).data.publicUrl;

  const banner = await prisma.banner.create({
    data: {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      url,
      clientPhone,
      clientEmail,
      cost: parseFloat(cost),
      imageUrl,
      createdById,
    },
  });
  return NextResponse.json(banner);
}
