import { randomUUID } from "crypto";
import { createClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

const prismaAny = prisma as any;

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sourceHome = await prismaAny.home.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        title: true,
        description: true,
        guests: true,
        bedrooms: true,
        bathrooms: true,
        country: true,
        municipality: true,
        exactAddress: true,
        checkInTime: true,
        contactNumber: true,
        latitude: true,
        longitude: true,
        photo: true,
        price: true,
        categoryName: true,
        propertyTypeId: true,
      },
    });

    if (!sourceHome) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const sourceAmenities = await prismaAny.homeAmenity.findMany({
      where: { homeId: sourceHome.id },
      select: {
        amenityId: true,
        status: true,
      },
    });

    const duplicatedHome = await prismaAny.$transaction(async (tx: any) => {
      const created = await tx.home.create({
        data: {
          id: randomUUID(),
          userId: sourceHome.userId,
          title: sourceHome.title,
          description: sourceHome.description,
          guests: sourceHome.guests,
          bedrooms: sourceHome.bedrooms,
          bathrooms: sourceHome.bathrooms,
          country: sourceHome.country,
          municipality: sourceHome.municipality,
          exactAddress: sourceHome.exactAddress,
          checkInTime: sourceHome.checkInTime,
          contactNumber: sourceHome.contactNumber,
          latitude: sourceHome.latitude,
          longitude: sourceHome.longitude,
          photo: sourceHome.photo,
          price: sourceHome.price,
          categoryName: sourceHome.categoryName,
          propertyTypeId: sourceHome.propertyTypeId,
          addedCategory:
            Array.isArray(sourceHome.categoryName) && sourceHome.categoryName.length > 0,
          addedDescription: !!(sourceHome.title && sourceHome.description),
          addedLocation: !!(sourceHome.country && sourceHome.municipality),
          addedAmenities: sourceAmenities.length > 0,
          publishStatus: "DRAFT",
          approvalRejectionReason: null,
          approvedAt: null,
          approvedById: null,
          paymentAmount: null,
          paymentBank: null,
          paymentDate: null,
          paymentMethod: null,
          paymentReference: null,
        },
      });

      for (const amenity of sourceAmenities) {
        await tx.homeAmenity.create({
          data: {
            id: randomUUID(),
            homeId: created.id,
            amenityId: amenity.amenityId,
            status: amenity.status,
          },
        });
      }

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        id: duplicatedHome.id,
        redirectTo: `/my-listing/${duplicatedHome.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error duplicating property:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}