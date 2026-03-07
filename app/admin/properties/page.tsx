import prisma from "@/app/lib/db";
import { PropertiesClient } from "../components/PropertiesClient";

async function getProperties() {
  const properties = await prisma.home.findMany({
    select: {
      id: true,
      title: true,
      price: true,
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
          lastName: true,
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
  });

  return properties;
}

export default async function PropertiesPage() {
  const properties = await getProperties();
  const propertiesWithAmenities = properties as Array<
    typeof properties[number] & { addedAmenities?: boolean; municipality?: string | null }
  >;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Propiedades</h1>
          <p className="text-gray-600 mt-1">Administra y modera todas las propiedades</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
          Exportar Listado
        </button>
      </div>

      <PropertiesClient properties={propertiesWithAmenities} />
    </div>
  );
}
