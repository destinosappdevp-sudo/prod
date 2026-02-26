import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { Home, CheckCircle, XCircle, Clock } from "lucide-react";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import Link from "next/link";

async function getProperties() {
  const properties = await prisma.home.findMany({
    include: {
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

  const stats = {
    total: propertiesWithAmenities.length,
    active: propertiesWithAmenities.filter(
      (p) => p.addedCategory && p.addedDescription && p.addedAmenities && p.addedLocation
    ).length,
    pending: propertiesWithAmenities.filter(
      (p) =>
        !p.addedCategory ||
        !p.addedDescription ||
        !p.addedAmenities ||
        !p.addedLocation
    ).length,
  };

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Home className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Propiedades</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Properties Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anfitrión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Favoritos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propertiesWithAmenities.map((property) => {
                const isComplete =
                  property.addedCategory &&
                  property.addedDescription &&
                  property.addedAmenities &&
                  property.addedLocation;
                
                return (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {property.title || "Sin título"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.country
                          ? getStateByValue(property.country)?.label
                          : "Sin ubicación"}
                        {property.country && property.municipality
                          ? ` - ${getMunicipalityByValue(property.country, property.municipality)?.label}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {property.User?.firstName} {property.User?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{property.User?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                        {property.categoryName || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">
                        {property.price ? `$${property.price}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property._count.Reservation}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property._count.Favorite}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isComplete ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Activa
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Incompleta
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link 
                        href={`/admin/properties/${property.id}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                      >
                        Ver/Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay propiedades registradas</p>
        </div>
      )}
    </div>
  );
}
