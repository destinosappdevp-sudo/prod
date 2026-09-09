import DestinationView from "../_components/DestinationView";
import DestinationViewLegacy from "../_components/DestinationViewLegacy";
import PackageView from "../_components/PackageView";
import { getPlatformFeatures } from "@/app/lib/platform-features";
import prisma from "@/app/lib/db";
import { notFound, redirect } from "next/navigation";

const prismaAny = prisma as any;

/**
 * Legacy (1 único hijo): la ficha del destino ES la ficha del paquete,
 * pantalla de una columna con imagen a todo ancho, sin sidebar.
 */
async function redirectToSinglePackage(slug: string) {
  const destination = await prismaAny.destination.findUnique({
    where: { slug },
    select: {
      id: true,
      Homes: {
        where: { publishStatus: "APPROVED" },
        select: { id: true, checkInTime: true },
        orderBy: { checkInTime: { sort: "asc", nulls: "last" } },
      },
    },
  });

  if (!destination) {
    notFound();
  }

  const futureHomes = destination.Homes.filter((h: any) => {
    if (!h.checkInTime) return false;
    const d = new Date(
      h.checkInTime.includes("T") ? h.checkInTime : `${h.checkInTime}T00:00`
    );
    return d.getTime() > Date.now();
  });
  const target = futureHomes[0] || destination.Homes[0] || null;

  if (!target) {
    return <DestinationViewLegacy slug={slug} />;
  }

  redirect(`/home/${target.id}`);
}

export default async function DestinosCatchAll({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;

  if (segments.length === 1) {
    const features = await getPlatformFeatures();
    if (features.multiDatesPerDestinationEnabled === true) {
      return <DestinationView slug={segments[0]} />;
    }
    return redirectToSinglePackage(segments[0]);
  }

  if (segments.length === 2) {
    return <PackageView categorySlug={segments[0]} slug={segments[1]} />;
  }

  notFound();
}