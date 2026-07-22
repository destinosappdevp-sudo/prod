import { unstable_noStore } from "next/cache";
import prisma from "@/app/lib/db";
import { DestinationsClient } from "../components/DestinationsClient";

const prismaAny = prisma as any;

async function getDestinations() {
  unstable_noStore();

  return prismaAny.destination.findMany({
    select: {
      id: true,
      title: true,
      subtitle: true,
      slug: true,
      photo: true,
      country: true,
      municipality: true,
      publishStatus: true,
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
}

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Destinos</h1>
          <p className="text-gray-600 mt-1">Administra los destinos y sus paquetes/fechas</p>
        </div>
      </div>

      <DestinationsClient destinations={destinations} />
    </div>
  );
}
