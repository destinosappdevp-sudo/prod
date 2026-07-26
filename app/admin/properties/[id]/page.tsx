import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DestinationEditForm from "@/app/admin/components/DestinationEditForm";
import CreatePackageFromDestination from "@/app/admin/components/CreatePackageFromDestination";
import { getAllStates } from "@/app/lib/venezuelaStates";
import { ArrowLeft, Calendar, Heart, Star, Package } from "lucide-react";
import Link from "next/link";
import { SupabaseImage } from "@/app/components/SupabaseImage";

const prismaAny = prisma as any;

async function getDestination(id: string) {
  const destination = await prismaAny.destination.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          firstName: true,
          email: true,
        },
      },
      _count: {
        select: {
          Homes: true,
          Favorite: true,
          Review: true,
        },
      },
      Homes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          checkInTime: true,
          price: true,
          priceVip: true,
          vipSeats: true,
          standardSeats: true,
          publishStatus: true,
          _count: {
            select: {
              Reservation: true,
              PackageSeat: true,
            },
          },
        },
      },
    },
  });

  if (!destination) {
    notFound();
  }

  return destination;
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

function formatCheckInTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value.includes("T") ? value : `${value}T00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destination = await getDestination(id);

  const states = getAllStates().map((s) => ({ value: s.value, label: s.label }));

  const propertyTypes = await prisma.property_types.findMany({
    orderBy: [{ name: "asc" }],
  });
  const categoriesForForm = propertyTypes.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    title: cat.title_es || cat.name,
  }));

  const selectedTypeIdsFromDestination = Array.isArray(destination.propertyTypeId)
    ? destination.propertyTypeId
    : [];
  const categoryNamesFromDestination = Array.isArray(destination.categoryName)
    ? destination.categoryName
    : [];
  const fallbackTypeIdsFromCategory =
    selectedTypeIdsFromDestination.length === 0
      ? categoriesForForm
          .filter((cat: any) => categoryNamesFromDestination.includes(cat.name))
          .map((cat: any) => cat.id)
      : [];
  const selectedPropertyTypeIds =
    selectedTypeIdsFromDestination.length > 0
      ? selectedTypeIdsFromDestination
      : fallbackTypeIdsFromCategory;

  const nextPackage = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    const d = new Date(h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`);
    return d.getTime() > Date.now();
  }).sort((a: any, b: any) => {
    const da = new Date(a.checkInTime.includes("T") ? a.checkInTime : `${a.checkInTime}T00:00`);
    const db = new Date(b.checkInTime.includes("T") ? b.checkInTime : `${b.checkInTime}T00:00`);
    return da.getTime() - db.getTime();
  })[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/properties"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {destination.title || "Sin título"}
          </h1>
          {destination.subtitle && (
            <p className="text-muted-foreground">{destination.subtitle}</p>
          )}
          <p className="text-muted-foreground mt-1">Detalles y edición del destino</p>
        </div>
        <Badge variant={destination.publishStatus === "APPROVED" ? "default" : "secondary"}>
          {statusLabels[destination.publishStatus] || destination.publishStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paquetes</p>
              <p className="text-xl font-bold">{destination._count.Homes}</p>
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
              <p className="text-xl font-bold">{destination._count.Favorite}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reviews</p>
              <p className="text-xl font-bold">{destination._count.Review}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próxima salida</p>
              <p className="text-sm font-bold">
                {nextPackage ? formatCheckInTime(nextPackage.checkInTime) : "Sin fechas"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DestinationEditForm
            destination={{
              ...destination,
              propertyTypeIds: selectedPropertyTypeIds,
            }}
            categories={categoriesForForm}
            states={states}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Imagen del Destino</h3>
            {destination.photo ? (
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
                <SupabaseImage
                  imagePath={destination.photo}
                  alt={destination.title || "Destino"}
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
            <p className="text-muted-foreground">{destination.User?.firstName || "Admin"}</p>
            <p className="text-sm text-muted-foreground">{destination.User?.email || "-"}</p>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Paquetes / Fechas</h2>
          <CreatePackageFromDestination
            destination={destination}
            categories={categoriesForForm}
            states={states}
          />
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha de salida</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Precios</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Cupos</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Reservas</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {destination.Homes.map((home: any) => (
                  <tr key={home.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">{formatCheckInTime(home.checkInTime)}</td>
                    <td className="px-4 py-3 font-medium">{home.title || "Sin título"}</td>
                    <td className="px-4 py-3 text-center">
                      E: ${home.price ?? 0}
                      {home.priceVip ? ` / VIP: $${home.priceVip}` : ""}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {home.standardSeats ?? 0} / {home.vipSeats ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">{home._count.Reservation}</td>
                    <td className="px-4 py-3">
                      <Badge variant={home.publishStatus === "APPROVED" ? "default" : "secondary"}>
                        {statusLabels[home.publishStatus] || home.publishStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/packages/${home.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {destination.Homes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No hay paquetes/fechas creados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
