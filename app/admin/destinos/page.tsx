import { unstable_noStore } from "next/cache";
import prisma from "@/app/lib/db";
import DestinosGroupClient from "../components/DestinosGroupClient";

const prismaAny = prisma as any;

async function getDestinations() {
  unstable_noStore();
  try {
    const destinations = await prismaAny.destination.findMany({
      select: {
        id: true, title: true, subtitle: true, slug: true, photo: true,
        country: true, municipality: true, publishStatus: true,
        Homes: { select: { checkInTime: true } },
        _count: { select: { Homes: true, Favorite: true, Review: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const now = new Date();
    return destinations.map((d: any) => {
      const packageDates = (d.Homes || [])
        .map((h: any) => h.checkInTime ? new Date(h.checkInTime) : null)
        .filter(Boolean) as Date[];
      const hasExpired = packageDates.length > 0 && packageDates.every((dt: Date) => dt < now);
      return {
        id: d.id, title: d.title, subtitle: d.subtitle, slug: d.slug,
        photo: d.photo, country: d.country, municipality: d.municipality,
        publishStatus: d.publishStatus, isExpired: packageDates.length > 0 && hasExpired,
        _count: d._count,
      };
    });
  } catch (error) {
    console.error("[admin/destinos] getDestinations error:", error);
    return [];
  }
}

async function getPasadasPackages() {
  unstable_noStore();
  try {
    const now = new Date();
    const homes = await prismaAny.home.findMany({
      where: { checkInTime: { not: null } },
      select: {
        id: true, title: true, photo: true, country: true, municipality: true,
        price: true, checkInTime: true, publishStatus: true, createdAt: true,
        destinationId: true,
        Destination: { select: { id: true, title: true, slug: true } },
        _count: { select: { Reservation: true, Favorite: true } },
      },
      orderBy: { checkInTime: "desc" },
    });
    return homes
      .map((h: any) => {
        const checkInTime = h.checkInTime instanceof Date ? h.checkInTime : new Date(h.checkInTime);
        return {
          ...h,
          checkInTime,
        };
      })
      .filter((h: any) => !isNaN(h.checkInTime.getTime()) && h.checkInTime < now);
  } catch (error) {
    console.error("[admin/destinos] getPasadasPackages error:", error);
    return [];
  }
}

async function getCategories() {
  unstable_noStore();
  try {
    return await prismaAny.property_types.findMany({ orderBy: [{ name: "asc" }] });
  } catch (error) {
    console.error("[admin/destinos] getCategories error:", error);
    return [];
  }
}

async function getAmenities() {
  unstable_noStore();
  try {
    return await prisma.amenityCategory.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { Amenity: { orderBy: { name: "asc" } } },
    });
  } catch (error) {
    console.error("[admin/destinos] getAmenities error:", error);
    return [];
  }
}

export default async function DestinosPage() {
  const [destinations, pasadasPackages, categories, amenities] = await Promise.all([
    getDestinations(),
    getPasadasPackages(),
    getCategories(),
    getAmenities(),
  ]);

  return (
    <DestinosGroupClient
      destinations={destinations}
      pasadasPackages={pasadasPackages}
      initialCategories={categories}
      amenityCategories={amenities}
    />
  );
}
