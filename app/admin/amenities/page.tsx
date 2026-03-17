import { unstable_noStore } from 'next/cache';
import prisma from "@/app/lib/db";
import AmenityManagerClient from "../components/AmenityManagerClient";

async function getAmenityData() {
  unstable_noStore();
  const categories = await prisma.amenityCategory.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        orderBy: { name: "asc" },
      },
    },
  });

  return categories;
}

export default async function AmenitiesPage() {
  const categories = await getAmenityData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
        <p className="text-gray-600 mt-1">
          Administra grupos de servicios (amenities). Las categorías de propiedad se gestionan aparte.
        </p>
      </div>
      <AmenityManagerClient initialCategories={categories} />
    </div>
  );
}
