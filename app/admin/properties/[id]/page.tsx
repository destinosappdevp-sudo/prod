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
  PackageSeat?: {
    zone?: string;
    row?: number;
    column?: string;
  } | null;
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
import PropertyDetailTabs from "@/app/admin/components/PropertyDetailTabs";

const prismaAny = prisma as any;

async function getProperty(id: string) {
  const property = await (prisma as any).home.findUnique({
    where: { id },
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

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  // Una reserva confirmada es un paquete pagado (pago confirmado).
  const confirmedReservations = property.Reservation.filter(
    (r: any) => r.Payment?.status === "CONFIRMED"
  );
  const confirmedReservationUserIds = new Set(
    confirmedReservations
      .map((r: any) => r.User?.id)
      .filter((userId: string | undefined): userId is string => Boolean(userId))
  );

  // Obtener usuarios ahorrando para este paquete
  const allSavings = await prismaAny.saving.findMany({
    where: {
      status: "APPROVED",
      amountUsd: { gt: 0 },
    },
    select: {
      id: true,
      userId: true,
      amountUsd: true,
      createdAt: true,
      paymentDetails: true,
      User: {
        select: {
          firstName: true,
          email: true,
        },
      },
    },
  });

  // Agrupar por usuario para evitar duplicados por múltiples depósitos.
  // Además, excluir usuarios con reserva pagada/confirmada y los que ya completaron el monto.
  const savingsByUser = new Map<
    string,
    {
      id: string;
      userId: string;
      plan: "vip" | "estandar" | null;
      planInferred: boolean;
      guestsCount: number;
      targetUsd: number;
      amountUsd: number;
      remainingUsd: number;
      createdAt: Date;
      User: {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
    }
  >();

  const savingsRows: Array<{
    saving: any;
    details: Record<string, any>;
    detailsPlan: "vip" | "estandar" | null;
    detailsGuests: number;
    detailsSeatIds: string[];
  }> = [];
  const seatIdsToResolve = new Set<string>();

  for (const saving of allSavings) {
    const details =
      saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? (saving.paymentDetails as Record<string, any>)
        : {};

    if (details.homeId !== property.id) continue;
    if (!saving.userId) continue;
    if (confirmedReservationUserIds.has(saving.userId)) continue;

    const detailsPlanRaw = typeof details.plan === "string" ? details.plan.trim().toLowerCase() : null;
    const detailsPlan: "vip" | "estandar" | null =
      detailsPlanRaw === "vip" ? "vip" : detailsPlanRaw === "estandar" ? "estandar" : null;
    const detailsSeatIds = Array.isArray(details.seatIds)
      ? details.seatIds
          .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      : typeof details.seatId === "string" && details.seatId.trim()
      ? [details.seatId.trim()]
      : [];
    for (const seatId of detailsSeatIds) {
      seatIdsToResolve.add(seatId);
    }
    const detailsGuests =
      typeof details.guests === "number" && details.guests > 0
        ? details.guests
        : detailsSeatIds.length > 0
        ? detailsSeatIds.length
        : 1;

    savingsRows.push({
      saving,
      details,
      detailsPlan,
      detailsGuests,
      detailsSeatIds,
    });
  }

  const seatZoneById = new Map<string, "VIP" | "STANDARD">();
  if (seatIdsToResolve.size > 0) {
    const seatRows = await prismaAny.packageSeat.findMany({
      where: {
        homeId: property.id,
        id: { in: Array.from(seatIdsToResolve) },
      },
      select: {
        id: true,
        zone: true,
      },
    });
    for (const seat of seatRows) {
      if (seat.zone === "VIP" || seat.zone === "STANDARD") {
        seatZoneById.set(seat.id, seat.zone);
      }
    }
  }

  for (const row of savingsRows) {
    const { saving, detailsPlan, detailsGuests, detailsSeatIds } = row;

    const resolvedPlanFromSeats = detailsSeatIds
      .map((seatId) => seatZoneById.get(seatId))
      .find((zone) => zone === "VIP" || zone === "STANDARD");
    const inferredPlan: "vip" | "estandar" | null =
      resolvedPlanFromSeats === "VIP"
        ? "vip"
        : resolvedPlanFromSeats === "STANDARD"
        ? "estandar"
        : null;
    const resolvedPlan = detailsPlan || inferredPlan;
    const planInferred = !detailsPlan && Boolean(inferredPlan);

    const existing = savingsByUser.get(saving.userId);
    if (existing) {
      existing.amountUsd += Number(saving.amountUsd || 0);
      existing.guestsCount = Math.max(existing.guestsCount, detailsGuests);
      if (resolvedPlan === "vip") {
        existing.plan = "vip";
        existing.planInferred = planInferred;
      } else if (!existing.plan && resolvedPlan === "estandar") {
        existing.plan = "estandar";
        existing.planInferred = planInferred;
      } else if (existing.plan === resolvedPlan && existing.planInferred && !planInferred) {
        // Si luego llega un depósito con plan explícito, quitar la marca de inferido.
        existing.planInferred = false;
      }
      if (new Date(saving.createdAt) > existing.createdAt) {
        existing.createdAt = new Date(saving.createdAt);
      }
    } else {
      savingsByUser.set(saving.userId, {
        id: saving.userId,
        userId: saving.userId,
        plan: resolvedPlan,
        planInferred,
        guestsCount: detailsGuests,
        targetUsd: 0,
        amountUsd: Number(saving.amountUsd || 0),
        remainingUsd: 0,
        createdAt: new Date(saving.createdAt),
        User: {
          firstName: saving.User?.firstName,
          email: saving.User?.email,
        },
      });
    }
  }

  const packageStandardPrice = Number(property.price || 0);
  const packageVipPrice = Number(property.priceVip || 0);
  const savings = Array.from(savingsByUser.values())
    .map((entry) => {
      const unitPrice =
        entry.plan === "vip" && packageVipPrice > 0 ? packageVipPrice : packageStandardPrice;
      const guestsCount = Math.max(entry.guestsCount || 1, 1);
      const targetUsd = Number((unitPrice * guestsCount).toFixed(2));
      const remainingUsd = Math.max(targetUsd - entry.amountUsd, 0);
      return { ...entry, guestsCount, targetUsd, remainingUsd };
    })
    .filter((entry) => entry.remainingUsd > 0)
    .sort((a, b) => b.amountUsd - a.amountUsd);

  // Obtener dueños de asientos apartados por ahorros activos (pendientes o aprobados).
  const activeSeatSavings = await prismaAny.saving.findMany({
    where: {
      status: { in: ["PENDING", "APPROVED"] },
      amountUsd: { gt: 0 },
    },
    select: {
      id: true,
      createdAt: true,
      paymentDetails: true,
      User: {
        select: {
          firstName: true,
          email: true,
        },
      },
    },
  });

  const seatOwnerBySeatId = new Map<
    string,
    {
      createdAt: Date;
      firstName?: string;
      lastName?: string;
      email?: string;
    }
  >();

  for (const saving of activeSeatSavings) {
    const details =
      saving.paymentDetails && typeof saving.paymentDetails === "object"
        ? (saving.paymentDetails as Record<string, any>)
        : {};
    if (details.homeId !== property.id) continue;

    const savingSeatIds = Array.isArray(details.seatIds)
      ? details.seatIds
          .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      : typeof details.seatId === "string" && details.seatId.trim()
      ? [details.seatId.trim()]
      : [];

    for (const seatId of savingSeatIds) {
      const existing = seatOwnerBySeatId.get(seatId);
      if (!existing || new Date(saving.createdAt) > existing.createdAt) {
        seatOwnerBySeatId.set(seatId, {
          createdAt: new Date(saving.createdAt),
          firstName: saving.User?.firstName,
          email: saving.User?.email,
        });
      }
    }
  }

  // Obtener asientos del paquete con ocupante (si aplica)
  const rawSeats = await prismaAny.packageSeat.findMany({
    where: { homeId: property.id },
    orderBy: [{ zone: "asc" }, { row: "asc" }, { column: "asc" }],
    include: {
      Reservation: {
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

  const seats = rawSeats.map((seat: any) => {
    const reservationOccupant = seat.Reservation?.User
      ? {
          firstName: seat.Reservation.User.firstName,
          email: seat.Reservation.User.email,
        }
      : null;
    const savingOwner = seatOwnerBySeatId.get(seat.id);
    const savingOccupant = savingOwner
      ? {
          firstName: savingOwner.firstName,
          email: savingOwner.email,
        }
      : null;
    const occupant = reservationOccupant || savingOccupant;
    const occupancySource = reservationOccupant
      ? "reservation"
      : savingOccupant
      ? "saving"
      : null;
    const isOccupied = Boolean(seat.Reservation || savingOccupant || seat.status === "OCCUPIED");

    return {
      id: seat.id,
      zone: seat.zone,
      row: seat.row,
      column: seat.column,
      status: isOccupied ? "OCCUPIED" : "AVAILABLE",
      occupant,
      occupancySource,
    };
  });
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


        {/* Tabs: Reservas Confirmadas, Usuarios Ahorrando, Asientos, Reservar y PDF */}
        <Card className="p-6 col-span-2">
          <PropertyDetailTabs
            propertyId={property.id}
            price={property.price ?? 0}
            priceVip={property.priceVip ?? null}
            confirmedReservations={confirmedReservations}
            savings={savings}
            seats={seats}
            packageInfo={{
              title: property.title || "Sin título",
              category: currentCategoryLabel,
              location: state ? state.label : "Sin ubicacion",
              municipality: municipality ? municipality.label : "Sin municipio",
              departureDateTime: property.checkInTime ?? null,
              meetingPoint: property.exactAddress ?? null,
              hostName: property.User?.firstName || "Sin anfitrión",
              price: property.price ?? 0,
              priceVip: property.priceVip ?? null,
              amenitiesStandard: amenityCategoriesForForm
                .flatMap((c: any) => c.amenities)
                .filter((a: any) => a.status === "YES")
                .map((a: any) => a.name),
              amenitiesVip: amenityCategoriesForForm
                .flatMap((c: any) => c.amenities)
                .filter((a: any) => a.status === "NO")
                .map((a: any) => a.name),
            }}
          />
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
