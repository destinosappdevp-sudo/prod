import HomeMap from "@/app/components/HomeMap";
import { HomeHostInfo } from "@/app/components/HomeHostInfo";
import { HomeReservationForm } from "@/app/components/HomeReservationForm";
import ShowCaseCategory from "@/app/components/ShowCaseCategory";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import prisma from "@/app/lib/db";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import { getPrimaryCategoryName } from "@/app/lib/property-categories";
import { toCategorySlug } from "@/app/lib/slug";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

const prismaAny = prisma as any;

async function getDataBySlug(slug: string) {
  noStore();
  return await prismaAny.home.findUnique({
    where: { slug },
    select: {
      id: true,
      photo: true,
      title: true,
      description: true,
      guests: true,
      bedrooms: true,
      bathrooms: true,
      categoryName: true,
      price: true,
      country: true,
      municipality: true,
      exactAddress: true,
      latitude: true,
      longitude: true,
      checkInTime: true,
      contactNumber: true,
      createdAt: true,
      slug: true,
      publishStatus: true,
      Reservation: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
      },
      User: {
        select: { profileImage: true, firstName: true },
      },
    },
  });
}

async function getAmenities(homeId: string) {
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { HomeAmenity: { where: { homeId } } },
      },
    },
  });

  return categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      iconKey: amenity.iconKey,
      iconUrl: amenity.iconUrl,
      status: amenity.HomeAmenity[0]?.status || "UNSPECIFIED",
    })),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { categorySlug: string; slug: string };
}): Promise<Metadata> {
  const data = await getDataBySlug(params.slug);
  if (!data) return { title: "Paquete no encontrado" };
  return {
    title: `${data.title} | Destinos Venezuela`,
    description: data.description?.slice(0, 160) || "Reserva tu cupo",
  };
}

async function DestinoPage({
  params,
}: {
  params: { categorySlug: string; slug: string };
}) {
  const data = await getDataBySlug(params.slug);

  if (!data) notFound();

  // Validar que la categoría en la URL coincida con la del paquete (SEO canonical)
  const correctCategorySlug = toCategorySlug(data.categoryName);
  if (params.categorySlug !== correctCategorySlug) {
    redirect(`/destinos/${correctCategorySlug}/${data.slug}`);
  }

  // Solo mostrar publicados (o permitir al propietario/admin ver drafts)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isApproved = data.publishStatus === "APPROVED";

  if (!isApproved) {
    // Verificar si es el dueño o admin para permitir vista previa
    if (!user) notFound();
    const userDb = await prismaAny.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });
    const canView =
      data.User?.id === user.id ||
      userDb?.role === "ADMIN" ||
      userDb?.role === "SUPERADMIN";
    if (!canView) notFound();
  }

  const amenityCategories = await getAmenities(data.id);
  const state = getStateByValue(data.country as string);
  const municipality =
    data.country && data.municipality
      ? getMunicipalityByValue(data.country, data.municipality)
      : null;

  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-7xl px-4 sm:px-6 lg:mt-10 lg:px-8">
      <h1 className="font-medium text-2xl mb-5">{data.title}</h1>
      <div className="relative h-[260px] sm:h-[360px] lg:h-[550px]">
        <SupabaseImage
          imagePath={data.photo as string}
          alt={data.title as string}
          fill
          className="rounded-lg h-full object-cover w-full"
        />
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
        <div className="w-full lg:w-2/3">
          <h3 className="text-xl font-medium">
            {municipality ? municipality.label : state?.label}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <p>{data.guests} Cupos</p>
            <span>·</span>
            <p>{data.bedrooms} Zona VIP</p>
            <span>·</span>
            <p>{data.bathrooms} Zona Estándar</p>
          </div>

          <div className="flex items-center mt-6">
            <HomeHostInfo
              firstName={data.User?.firstName}
              userPicture={data.User?.profileImage}
              createdAt={data.createdAt}
            />
          </div>

          <Separator className="my-7" />
          <ShowCaseCategory
            categoryName={getPrimaryCategoryName(data.categoryName)}
            categoryNames={data.categoryName}
          />
          <Separator className="my-7" />
          <p className="text-muted-foreground">{data.description}</p>
          <Separator className="my-7" />
          {data.exactAddress && (
            <>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{data.exactAddress}</span>
              </div>
              <Separator className="my-7" />
            </>
          )}

          <div>
            <h3 className="text-xl font-semibold mb-4">Lo que incluye este paquete</h3>
            <div className="space-y-6">
              {amenityCategories.map(
                (category: {
                  id: string;
                  name: string;
                  amenities: {
                    id: string;
                    name: string;
                    iconUrl?: string;
                    iconKey?: string;
                    status: string;
                  }[];
                }) => {
                  const available = category.amenities.filter(
                    (a) => a.status === "YES"
                  );
                  if (available.length === 0) return null;
                  return (
                    <div key={category.id} className="space-y-3">
                      <h4 className="text-base font-semibold">{category.name}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {available.map((amenity) => (
                          <div
                            key={amenity.id}
                            className="flex items-center gap-3"
                          >
                            {amenity.iconUrl ? (
                              <Image
                                src={amenity.iconUrl}
                                alt={amenity.name}
                                width={20}
                                height={20}
                                className="h-5 w-5"
                              />
                            ) : (
                              <span className="h-5 w-5 rounded-full bg-gray-100 text-[10px] flex items-center justify-center">
                                {amenity.iconKey?.slice(0, 2).toUpperCase() || "SV"}
                              </span>
                            )}
                            <span className="text-sm text-gray-700">
                              {amenity.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {amenityCategories.some((cat: any) =>
              cat.amenities.some((a: any) => a.status === "NO")
            ) && (
              <div className="mt-8">
                <h4 className="text-base font-semibold mb-3">No incluidos</h4>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {amenityCategories.flatMap((cat: any) =>
                    cat.amenities
                      .filter((a: any) => a.status === "NO")
                      .map((a: any) => (
                        <span key={a.id}>No disponible: {a.name}</span>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-7" />
          <HomeMap
            stateValue={state?.value as string}
            municipalityValue={data.municipality as string}
            exactAddress={data.exactAddress as string | undefined}
            latitude={data.latitude as number | undefined}
            longitude={data.longitude as number | undefined}
          />
        </div>

        <HomeReservationForm
          homeId={data.id}
          userId={user?.id}
          reservation={data.Reservation}
          price={data.price as number}
          maxGuests={data.guests ? parseInt(data.guests as string) : undefined}
        />
      </div>
    </div>
  );
}

export default DestinoPage;
