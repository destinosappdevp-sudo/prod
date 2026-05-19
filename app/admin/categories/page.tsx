import prisma from "@/app/lib/db";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

async function getInitialCategories() {
  const prismaAny = prisma as any;
  return prismaAny.property_types.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export default async function CategoriesPage() {
  const initialCategories = await getInitialCategories();

  return <CategoriesClient initialCategories={initialCategories} />;
}



