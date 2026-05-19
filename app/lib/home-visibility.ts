import { revalidatePath } from "next/cache";
import prisma from "@/app/lib/db";
import { normalizeCategoryNames } from "@/app/lib/property-categories";

type HomeVisibilitySnapshot = {
  id: string;
  title: string | null;
  description: string | null;
  photo: string | null;
  price: number | null;
  country: string | null;
  municipality: string | null;
  categoryName: string[] | null;
  propertyTypeId: number[] | null;
};

function hasText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function buildHomeVisibilityFlags(home: HomeVisibilitySnapshot) {
  const categoryNames = normalizeCategoryNames(home.categoryName);
  const propertyTypeIds = Array.isArray(home.propertyTypeId)
    ? home.propertyTypeId.filter((value): value is number => Number.isInteger(value) && value > 0)
    : [];

  return {
    addedCategory: categoryNames.length > 0 || propertyTypeIds.length > 0,
    // Para visibilidad pública basta con que la ficha tenga contenido base real.
    addedDescription: hasText(home.title) && hasText(home.photo) && home.price != null,
    addedLocation: hasText(home.country) && hasText(home.municipality),
  };
}

export async function syncHomeVisibilityFlags(
  homeId: string,
  prismaClient: typeof prisma | any = prisma
) {
  const home = (await prismaClient.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      title: true,
      description: true,
      photo: true,
      price: true,
      country: true,
      municipality: true,
      categoryName: true,
      propertyTypeId: true,
    },
  })) as HomeVisibilitySnapshot | null;

  if (!home) {
    return null;
  }

  const flags = buildHomeVisibilityFlags(home);

  return prismaClient.home.update({
    where: { id: homeId },
    data: flags,
    select: {
      id: true,
      addedCategory: true,
      addedDescription: true,
      addedLocation: true,
    },
  });
}

export function revalidateHomeVisibilityPaths(homeId: string) {
  revalidatePath("/");
  revalidatePath(`/home/${homeId}`);
  revalidatePath(`/checkout/${homeId}`);
  revalidatePath("/my-dashboard");
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${homeId}`);
  revalidatePath("/admin/alojamientos");
}



