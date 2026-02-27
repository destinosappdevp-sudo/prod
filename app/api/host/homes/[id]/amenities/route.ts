import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

async function applyAmenityUpdates(homeId: string, amenities: { amenityId: string; status: "YES" | "NO" | "UNSPECIFIED" }[]) {
  const deleteIds = amenities
    .filter((item) => item.status === "UNSPECIFIED")
    .map((item) => item.amenityId);

  const upserts = amenities.filter((item) => item.status !== "UNSPECIFIED");

  const operations = [];

  if (deleteIds.length > 0) {
    operations.push(
      prismaAny.homeAmenity.deleteMany({
        where: {
          homeId,
          amenityId: { in: deleteIds },
        },
      })
    );
  }

  upserts.forEach((item) => {
    operations.push(
      prismaAny.homeAmenity.upsert({
        where: {
          homeId_amenityId: {
            homeId,
            amenityId: item.amenityId,
          },
        },
        update: {
          status: item.status,
        },
        create: {
          homeId,
          amenityId: item.amenityId,
          status: item.status,
        },
      })
    );
  });

  const hasSelected = upserts.length > 0;
  operations.push(
    prismaAny.home.update({
      where: { id: homeId },
      data: { addedAmenities: hasSelected },
    })
  );

  if (operations.length > 0) {
    await prismaAny.$transaction(operations);
  }
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

    const body = await request.json();
    const amenities = Array.isArray(body?.amenities) ? body.amenities : [];

    await applyAmenityUpdates(params.id, amenities);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
