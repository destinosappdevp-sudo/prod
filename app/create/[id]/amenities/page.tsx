import prisma from "@/app/lib/db";
import CreateAmenitiesForm from "@/app/components/CreateAmenitiesForm";

const prismaAny = prisma as any;

async function getAmenitiesData() {
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return (categories as Array<any>).map((category) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      iconKey: amenity.iconKey,
      iconUrl: amenity.iconUrl,
      status: "UNSPECIFIED" as const,
    })),
  }));
}

export default async function AmenitiesPage({
  params,
}: {
  params: { id: string };
}) {
  const categories = await getAmenitiesData();

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          ¿Qué servicios ofrece tu lugar?
        </h2>
        <p className="text-muted-foreground mt-2">
          Marca con un check si lo tienes, con una X si no, o déjalo en blanco.
        </p>
      </div>
      <CreateAmenitiesForm homeId={params.id} categories={categories} />
    </>
  );
}
