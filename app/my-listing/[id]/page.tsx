import { redirect, notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PropertyEditForm from "@/app/admin/components/PropertyEditForm";
import { getAllStates, getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { ArrowLeft, Calendar, Heart, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const prismaAny = prisma as any;

async function getPropertyForHost(id: string, userId: string) {
  const property = await prisma.home.findFirst({
    where: { id, userId },
    include: {
      User: {
        select: {
          firstName: true,
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
              email: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  return property;
}

export default async function HostPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { id } = await params;
  const property = await getPropertyForHost(id, user.id);
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
  const amenityCategoriesForForm = (amenityCategories as Array<any>).map((category) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      iconKey: amenity.iconKey,
      iconUrl: amenity.iconUrl,
      status: amenity.HomeAmenity[0]?.status || "UNSPECIFIED",
    })),
  }));
  const propertyDetails = property as typeof property & {
    municipality: string | null;
    exactAddress: string | null;
    checkInTime: string | null;
    contactNumber: string | null;
    latitude: number | null;
    longitude: number | null;
    addedAmenities: boolean;
  };
  // Obtener property_types desde la base de datos
  const propertyTypes = await prismaAny.property_types.findMany({ orderBy: [{ name: "asc" }] });
  const selectedTypeIdsFromProperty =
    Array.isArray(propertyDetails.propertyTypeId) && propertyDetails.propertyTypeId.length > 0
      ? propertyDetails.propertyTypeId
      : [];
  const categoryNamesFromProperty =
    Array.isArray(propertyDetails.categoryName) && propertyDetails.categoryName.length > 0
      ? propertyDetails.categoryName
      : [];
  const fallbackTypeIdsFromCategory =
    selectedTypeIdsFromProperty.length === 0
      ? propertyTypes
          .filter((pt: any) => categoryNamesFromProperty.includes(pt.name))
          .map((pt: any) => pt.id)
      : [];
  const selectedPropertyTypeIds =
    selectedTypeIdsFromProperty.length > 0
      ? selectedTypeIdsFromProperty
      : fallbackTypeIdsFromCategory.length > 0
      ? fallbackTypeIdsFromCategory
      : [];
  const selectedCategoryLabels =
    selectedPropertyTypeIds.length > 0
      ? propertyTypes
          .filter((pt: any) => selectedPropertyTypeIds.includes(pt.id))
          .map((pt: any) => pt.title_es || pt.name)
        : categoryNamesFromProperty.length > 0
        ? categoryNamesFromProperty
      : [];
  const propertyForForm = {
    ...propertyDetails,
    municipality: propertyDetails.municipality ?? null,
    exactAddress: propertyDetails.exactAddress ?? null,
    checkInTime: propertyDetails.checkInTime ?? null,
    contactNumber: propertyDetails.contactNumber ?? null,
    latitude: propertyDetails.latitude ?? null,
    longitude: propertyDetails.longitude ?? null,
    propertyTypeId: selectedPropertyTypeIds[0] ?? null,
    propertyTypeIds: selectedPropertyTypeIds,
  };
  const states = getAllStates();
  const state = propertyDetails.country
    ? getStateByValue(propertyDetails.country)
    : null;
  const municipality =
    propertyDetails.country && propertyDetails.municipality
      ? getMunicipalityByValue(
          propertyDetails.country,
          propertyDetails.municipality
        )
      : null;

  const isComplete =
    propertyDetails.addedCategory &&
    propertyDetails.addedDescription &&
    propertyDetails.addedAmenities &&
    propertyDetails.addedLocation;

  // Usar property_types para el selector de categorías
  const categoriesForForm = propertyTypes.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    title: cat.title_es || cat.name,
  }));

  const statesForForm = states.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/my-dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {propertyDetails.title || "Sin título"}
          </h1>
          <p className="text-gray-600 mt-1">
            Detalles y edición de tu anuncio
          </p>
        </div>
        {isComplete ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle size={16} className="mr-1" />
            Activa
          </Badge>
        ) : (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <XCircle size={16} className="mr-1" />
            Incompleta
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reservas</p>
              <p className="text-xl font-bold">
                {propertyDetails._count.Reservation}
              </p>
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
              <p className="text-xl font-bold">
                {propertyDetails._count.Favorite}
              </p>
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
                ${propertyDetails.price || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Imagen de la Propiedad</h3>
          {propertyDetails.photo ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${propertyDetails.photo}`}
                alt={propertyDetails.title || "Propiedad"}
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
              <p className="font-medium">{selectedCategoryLabels.join(", ") || "Sin categoría"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ubicacion</p>
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
                {propertyDetails.User?.firstName}
              </p>
              <p className="text-xs text-gray-500">
                {propertyDetails.User?.email}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 col-span-2">
          <h3 className="text-lg font-semibold mb-4">Reservas Recientes</h3>
          {propertyDetails.Reservation.length > 0 ? (
            <div className="space-y-3">
              {propertyDetails.Reservation.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {reservation.User?.firstName}
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
                      Creada: {new Date(reservation.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No hay reservas aún
            </p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 pl-6">Editar Anuncio</h2>
        <PropertyEditForm
          property={propertyForForm}
          categories={categoriesForForm}
          states={statesForForm}
          updateEndpoint={`/api/host/properties/${propertyDetails.id}`}
          amenityCategories={amenityCategoriesForForm}
        />
      </div>
    </div>
  );
}
