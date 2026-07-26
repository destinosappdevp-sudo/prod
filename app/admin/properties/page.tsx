import { unstable_noStore } from "next/cache";
import prisma from "@/app/lib/db";
import { DestinationsClient } from "../components/DestinationsClient";

const prismaAny = prisma as any;

async function getDestinations() {
  unstable_noStore();

  const destinations = await prismaAny.destination.findMany({
    select: {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      photo: true,
      country: true,
      municipality: true,
      publishStatus: true,
      Homes: {
        select: {
          checkInTime: true,
        },
      },
      _count: {
        select: {
          Homes: true,
          Favorite: true,
          Review: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 500,
  });

  const now = new Date();
  return destinations.map((d: any) => {
    const packageDates = (d.Homes || [])
      .map((h: any) => h.checkInTime ? new Date(h.checkInTime) : null)
      .filter(Boolean) as Date[];
    const hasExpired = packageDates.length > 0 && packageDates.every((dt: Date) => dt < now);
    return {
      id: d.id,
      title: d.title,
      subtitle: d.subtitle,
      slug: d.slug,
      photo: d.photo,
      country: d.country,
      municipality: d.municipality,
      publishStatus: d.publishStatus,
      isExpired: packageDates.length > 0 && hasExpired,
      _count: d._count,
    };
  });
}

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Destinos</h1>
          <p className="text-muted-foreground mt-1">Administra los destinos y sus paquetes/fechas</p>
        </div>
      </div>

      <DestinationsClient destinations={destinations} />
    </div>
  );
}
