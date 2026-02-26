import { redirect, notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PropertyEditForm from "@/app/admin/components/PropertyEditForm";
import { categoryItems } from "@/app/lib/categoryItems";
import { getAllStates, getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { ArrowLeft, Calendar, Heart, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

async function getPropertyForHost(id: string, userId: string) {
  const property = await prisma.home.findFirst({
    where: { id, userId },
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
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const property = await getPropertyForHost(params.id, user.id);
  const propertyDetails = property as typeof property & {
    municipality: string | null;
    exactAddress: string | null;
    checkInTime: string | null;
    contactNumber: string | null;
  };
  const propertyForForm = {
    ...propertyDetails,
    municipality: propertyDetails.municipality ?? null,
    exactAddress: propertyDetails.exactAddress ?? null,
    checkInTime: propertyDetails.checkInTime ?? null,
    contactNumber: propertyDetails.contactNumber ?? null,
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
    propertyDetails.addedLocation;

  const categoriesForForm = categoryItems.map((cat) => ({
    name: cat.name,
    title: cat.title.es,
  }));

  const statesForForm = states.map((s) => ({
    value: s.value,
    label: s.label,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/my-listing"
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
              <p className="text-sm text-gray-600">Precio/Noche</p>
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
              <p className="font-medium">
                {categoryItems.find((c) => c.name === propertyDetails.categoryName)
                  ?.title.es || "Sin categoría"}
              </p>
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
                {propertyDetails.User?.firstName} {propertyDetails.User?.lastName}
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
        <h2 className="text-2xl font-bold mb-4">Editar Anuncio</h2>
        <PropertyEditForm
          property={propertyForForm}
          categories={categoriesForForm}
          states={statesForForm}
          updateEndpoint={`/api/host/properties/${propertyDetails.id}`}
        />
      </div>
    </div>
  );
}
