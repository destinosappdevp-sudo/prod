import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

async function applyAmenityUpdates(homeId: string, amenities: { amenityId: string; status: "YES" | "NO" | "UNSPECIFIED" }[]) {
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

    const home = await prisma.home.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!home || home.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const amenities = Array.isArray(body?.amenities) ? body.amenities : [];

    await applyAmenityUpdates(id, amenities);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
