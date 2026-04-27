type Reservation = {
  id: string;
  Payment?: {
    paymentMethod?: string;
    referenceNumber?: string;
    amount: number;
    status?: string;
  };
  User?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  startDate: string;
  endDate: string;
  nights: number;
  status?: string;
};
type AmenityCategory = {
  id: string;
  name: string;
  Amenity: {
    id: string;
    name: string;
    iconKey?: string;
    iconUrl?: string;
    HomeAmenity: { status?: string }[];
  }[];
};
import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { Card } from "@/components/ui/card";
import PropertyEditForm from "@/app/admin/components/PropertyEditForm";
import PropertyStatusControl from "@/app/admin/components/PropertyStatusControl";
import { getAllStates, getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { ArrowLeft, Calendar, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getPaymentMethodLabel } from "@/app/lib/payment-currency";

const prismaAny = prisma as any;

async function getProperty(id: string) {
  const property = await (prisma as any).home.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          profileImage: true,
        },
      },
      _count: {
        select: {
          Reservation: true,
          Favorite: true,
        },
      },
      Reservation: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        include: {
          User: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          Payment: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return property;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  const amenityCategories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          HomeAmenity: {
            where: { homeId: property.id },
          },
        },
      },
    },
  });
  const amenityCategoriesForForm = amenityCategories.map((category: AmenityCategory) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity) => ({
      id: amenity.id,
      name: amenity.name,
      iconKey: amenity.iconKey,
      iconUrl: amenity.iconUrl,
      status: amenity.HomeAmenity[0]?.status || "UNSPECIFIED",
    })),
  }));
  const states = getAllStates();
  const state = property.country ? getStateByValue(property.country) : null;
  const municipality =
    property.country && property.municipality
      ? getMunicipalityByValue(property.country, property.municipality)
      : null;

  // Preparar categorías para el formulario desde la base de datos
  const propertyTypes = await prisma.property_types.findMany({
    orderBy: [{ name: "asc" }],
  });
  const categoriesForForm = propertyTypes.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    title: cat.title_es || cat.name,
  }));
  const selectedTypeIdsFromProperty =
    Array.isArray((property as any).propertyTypeId) && (property as any).propertyTypeId.length > 0
      ? ((property as any).propertyTypeId as number[])
      : [];
  const categoryNamesFromProperty =
    Array.isArray((property as any).categoryName) && (property as any).categoryName.length > 0
      ? ((property as any).categoryName as string[])
      : [];
  const fallbackTypeIdsFromCategory =
    selectedTypeIdsFromProperty.length === 0
      ? categoriesForForm
          .filter((cat: any) => categoryNamesFromProperty.includes(cat.name))
          .map((cat: any) => cat.id)
      : [];
  const selectedPropertyTypeIds =
    selectedTypeIdsFromProperty.length > 0
      ? selectedTypeIdsFromProperty
      : fallbackTypeIdsFromCategory.length > 0
      ? fallbackTypeIdsFromCategory
      : [];
  const currentCategoryLabel =
    selectedPropertyTypeIds.length > 0
      ? categoriesForForm
          .filter((cat: any) => selectedPropertyTypeIds.includes(cat.id))
          .map((cat: any) => cat.title)
          .join(", ")
      : categoryNamesFromProperty.join(", ") || "Sin categoría";

  // Preparar estados para el formulario
  const statesForForm = states.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/properties"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {property.title || "Sin título"}
          </h1>
          <p className="text-gray-600 mt-1">
            Detalles y edición de la Paquete
          </p>
        </div>
        <PropertyStatusControl
          propertyId={property.id}
          initialStatus={property.publishStatus}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reservas</p>
              <p className="text-xl font-bold">{property._count.Reservation}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Heart className="text-pink-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Favoritos</p>
              <p className="text-xl font-bold">{property._count.Favorite}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl font-bold">$</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Precio Desde</p>
              <p className="text-xl font-bold">
                ${property.price || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Property Info */}
      <div className="grid grid-cols-3 gap-6">
        {/* Image and Basic Info */}
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Imagen de la Paquete</h3>
          {property.photo ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${property.photo}`}
                alt={property.title || "Paquete"}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <p className="text-gray-500">Sin imagen</p>
            </div>
          )}
          
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Categoría</p>
              <p className="font-medium">{currentCategoryLabel}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ubicación</p>
              <p className="font-medium">
                {state ? state.label : "Sin ubicacion"}
              </p>
              <p className="text-sm text-gray-600 mt-2">Municipio</p>
              <p className="font-medium">
                {municipality ? municipality.label : "Sin municipio"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Anfitrión</p>
              <p className="font-medium">
                {property.User?.firstName} {property.User?.lastName}
              </p>
              <p className="text-xs text-gray-500">{property.User?.email}</p>
            </div>
          </div>
        </Card>

        {/* Recent Reservations */}
        <Card className="p-6 col-span-2">
          <h3 className="text-lg font-semibold mb-4">Reservas Recientes</h3>
          {property.Reservation.length > 0 ? (
            <div className="space-y-3">
              {property.Reservation.map((reservation: Reservation) => {
                const payment = reservation.Payment;
                
                const reservationStatusColors: Record<string, string> = {
                  PENDING: "bg-yellow-100 text-yellow-800",
                  CONFIRMED: "bg-green-100 text-green-800",
                  CANCELLED: "bg-red-100 text-red-800",
                  COMPLETED: "bg-blue-100 text-blue-800",
                };
                
                const paymentStatusColors: Record<string, string> = {
                  PENDING: "bg-yellow-100 text-yellow-800",
                  CONFIRMED: "bg-green-100 text-green-800",
                  REJECTED: "bg-red-100 text-red-800",
                  CANCELLED: "bg-gray-100 text-gray-800",
                };

                return (
                  <div
                    key={reservation.id}
                    className="p-4 bg-gray-50 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {reservation.User?.firstName} {reservation.User?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.User?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(reservation.startDate).toLocaleDateString("es-ES")} -{" "}
                          {new Date(reservation.endDate).toLocaleDateString("es-ES")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservation.nights} {reservation.nights === 1 ? "noche" : "noches"}
                        </p>
                      </div>
                    </div>
                    
                    {payment && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            Método: <span className="font-medium text-gray-900">{getPaymentMethodLabel(payment.paymentMethod, (payment as any).paymentDetails)}</span>
                          </p>
                          {payment.referenceNumber && (
                            <p className="text-xs text-gray-500">
                              Ref: {payment.referenceNumber}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-gray-900">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${paymentStatusColors[payment.status as string] || "bg-gray-100 text-gray-800"}`}>
                            {payment.status === "PENDING" ? "Pago Pendiente" :
                             payment.status === "CONFIRMED" ? "Pago Confirmado" :
                             payment.status === "REJECTED" ? "Pago Rechazado" :
                             payment.status}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${reservationStatusColors[reservation.status as string] || "bg-gray-100 text-gray-800"}`}>
                            {reservation.status === "PENDING" ? "Pendiente" :
                             reservation.status === "CONFIRMED" ? "Confirmada" :
                             reservation.status === "CANCELLED" ? "Cancelada" :
                             reservation.status === "COMPLETED" ? "Completada" :
                             reservation.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay reservas aún
            </p>
          )}
        </Card>
      </div>

      {/* Edit Form */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Editar Paquete</h2>
        <PropertyEditForm
          property={{
            ...property,
            propertyTypeId: selectedPropertyTypeIds[0] ?? null,
            propertyTypeIds: selectedPropertyTypeIds,
          }}
          categories={categoriesForForm}
          states={statesForForm}
          amenityCategories={amenityCategoriesForForm}
          allowDelete
          deleteEndpoint={`/api/admin/properties/${property.id}`}
        />
      </div>
    </div>
  );
}
