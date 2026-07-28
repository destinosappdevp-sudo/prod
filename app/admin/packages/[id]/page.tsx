import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { Card } from "@/components/ui/card";
import PropertyEditForm from "@/app/admin/components/PropertyEditForm";
import PropertyDetailTabs from "@/app/admin/components/PropertyDetailTabs";
import { getAllStates } from "@/app/lib/venezuelaStates";
import { ArrowLeft, Calendar, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const prismaAny = prisma as any;

async function getProperty(id: string) {
  const property = await prismaAny.home.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          firstName: true,
          email: true,
          profileImage: true,
        },
      },
      PrivateOwner: {
        select: {
          id: true,
          firstName: true,
          cedula: true,
          email: true,
        },
      },
      Destination: {
        select: {
          id: true,
          title: true,
          slug: true,
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
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              email: true,
            },
          },
          Payment: true,
          PackageSeat: {
            select: {
              id: true,
              zone: true,
              row: true,
              column: true,
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

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  const seats = await prismaAny.packageSeat.findMany({
    where: { homeId: id },
    orderBy: [{ row: "asc" }, { column: "asc" }],
  });

  const confirmedReservations = property.Reservation.filter(
    (r: any) =>
      r.Payment?.status === "CONFIRMED" ||
      r.status === "CONFIRMED" ||
      r.status === "COMPLETED"
  );

  const savingsUsersCount = 0; // Simplificado para esta versión

  const states = getAllStates().map((s) => ({ value: s.value, label: s.label }));

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

  const amenityCategories = await getAmenityCategoriesWithStatuses(property.id);

  const packageInfo = {
    title: property.title,
    category: categoryNamesFromProperty.join(", ") || "Sin categoría",
    location: property.municipality
      ? `${property.municipality}, ${property.country}`
      : property.country || "No especificada",
    municipality: property.municipality,
    departureDateTime: property.checkInTime ?? null,
    meetingPoint: property.exactAddress ?? null,
    hostName: property.User?.firstName ?? "Destinos Venezuela",
    hostEmail: property.User?.email ?? null,
    hostPhone: property.contactNumber ?? null,
    price: property.price ?? 0,
    priceVip: property.priceVip ?? null,
    amenitiesStandard: [],
    amenitiesVip: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={property.Destination ? `/admin/properties/${property.Destination.id}` : "/admin/properties"}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {property.title || "Sin título"}
          </h1>
          {property.Destination && (
            <p className="text-muted-foreground">
              Destino: {" "}
              <Link
                href={`/admin/properties/${property.Destination.id}`}
                className="text-blue-600 hover:underline"
              >
                {property.Destination.title}
              </Link>
            </p>
          )}
          <p className="text-muted-foreground mt-1">Detalles y edición del paquete</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reservas</p>
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
              <p className="text-sm text-muted-foreground">Favoritos</p>
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
              <p className="text-sm text-muted-foreground">Precio Desde</p>
              <p className="text-xl font-bold">${property.price || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PropertyEditForm
            property={{
              ...property,
              propertyTypeId: selectedPropertyTypeIds[0] ?? null,
              propertyTypeIds: selectedPropertyTypeIds,
              privateOwnerName: property.PrivateOwner?.firstName ?? null,
              privateOwnerCedula: property.PrivateOwner?.cedula ?? null,
            }}
            categories={categoriesForForm}
            states={states}
            amenityCategories={amenityCategories}
            updateEndpoint={`/api/admin/properties/${property.id}`}
            allowDelete={true}
            deleteEndpoint={`/api/admin/properties/${property.id}/delete`}
          />

          <PropertyDetailTabs
            propertyId={property.id}
            price={property.price ?? 0}
            priceVip={property.priceVip ?? null}
            confirmedReservations={confirmedReservations}
            savings={[]}
            packageInfo={packageInfo}
            seats={seats}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Imagen del Paquete</h3>
            {property.photo ? (
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
                <Image
                  src={property.photo}
                  alt={property.title || "Paquete"}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[3/2] rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                Sin imagen
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Creado por</h3>
            <p className="text-muted-foreground">{property.User?.firstName || "Admin"}</p>
            <p className="text-sm text-muted-foreground">{property.User?.email || "-"}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function getAmenityCategoriesWithStatuses(homeId: string) {
  const prismaAny = prisma as any;
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    include: {
      Amenity: {
        where: { isActive: true },
        include: {
          HomeAmenity: {
            where: { homeId },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return categories.map((category: any) => ({
    ...category,
    amenities: category.Amenity.map((amenity: any) => ({
      ...amenity,
      status:
        amenity.HomeAmenity.length > 0
          ? amenity.HomeAmenity[0].status
          : "UNSPECIFIED",
    })),
  }));
}
