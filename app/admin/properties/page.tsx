import { unstable_noStore } from 'next/cache';
import prisma from "@/app/lib/db";
import { PropertiesClient } from "../components/PropertiesClient";

const prismaAny = prisma as any;

async function getActiveReservations() {
  unstable_noStore();
  const now = new Date();
  return prismaAny.reservation.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { gt: now },
    },
    select: {
      id: true,
      homeId: true,
      userId: true,
      startDate: true,
      endDate: true,
      nights: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      User: {
        select: {
          firstName: true,
          email: true,
        },
      },
      Home: {
        select: {
          title: true,
          price: true,
        },
      },
      Payment: {
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          referenceNumber: true,
          amount: true,
          paymentDetails: true,
          confirmedAt: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

async function getProperties() {
  unstable_noStore();

  const savings = await prismaAny.saving.findMany({
    where: {
      status: "APPROVED",
      amountUsd: { gt: 0 },
    },
    select: {
      userId: true,
      paymentDetails: true,
    },
  });

  const savingsUsersByHome = new Map<string, Set<string>>();
  for (const saving of savings) {
    const details = saving.paymentDetails as { homeId?: string } | null;
    const homeId = typeof details?.homeId === "string" ? details.homeId : null;
    if (!homeId) continue;

    const users = savingsUsersByHome.get(homeId) ?? new Set<string>();
    users.add(saving.userId);
    savingsUsersByHome.set(homeId, users);
  }
  
  // Optimized: use select instead of include _count to avoid extra joins
  // Limit to prevent loading too many properties at once
  const properties = await prisma.home.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      guests: true,
      checkInTime: true,
      country: true,
      municipality: true,
      categoryName: true,
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
      addedAmenities: true,
      publishStatus: true,
      User: {
        select: {
          firstName: true,
          email: true,
        },
      },
      _count: {
        select: {
          Reservation: true,
          Favorite: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500, // Limit to prevent overwhelming the page - client-side pagination handles rest
  });

  return properties.map((property) => ({
    ...property,
    savingsUsersCount: savingsUsersByHome.get(property.id)?.size ?? 0,
  }));
}

export default async function PropertiesPage() {
  const [properties, activeReservations] = await Promise.all([
    getProperties(),
    getActiveReservations(),
  ]);
  const propertiesWithAmenities = properties as Array<
    typeof properties[number] & { addedAmenities?: boolean; municipality?: string | null }
  >;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Paquetes</h1>
          <p className="text-gray-600 mt-1">Administra y modera todas las Paquetes</p>
        </div>
      </div>

      <PropertiesClient
        properties={propertiesWithAmenities}
        activeReservations={activeReservations}
      />
    </div>
  );
}



