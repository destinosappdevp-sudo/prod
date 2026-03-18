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

const prismaAny = prisma as any;

async function getData(homeId: string) {
  noStore();
  const data = await (prisma as any).home.findUnique({
    where: {
      id: homeId,
    },
    select: {
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
      Reservation: {
        where: {
          homeId: homeId,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
        },
      },
      User: {
        select: {
          profileImage: true,
          firstName: true,
        },
      },
    },
  });
  return data;
}

async function getAmenities(homeId: string) {
  const categories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          HomeAmenity: {
            where: { homeId },
          },
        },
      },
    },
  });

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
  return categories.map((category: AmenityCategory) => ({
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
}

async function SingleHomePage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  const amenityCategories = await getAmenities(params.id);
  const state = getStateByValue(data?.country as string);
  const municipality =
    data?.country && data?.municipality
      ? getMunicipalityByValue(data.country, data.municipality)
      : null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="mx-auto mt-6 mb-12 w-full max-w-7xl px-4 sm:px-6 lg:mt-10 lg:px-8">
      <h1 className="font-medium text-2xl mb-5">{data?.title}</h1>
      <div className="relative h-[260px] sm:h-[360px] lg:h-[550px]">
        <SupabaseImage
          imagePath={data?.photo as string}
          alt={data?.title as string}
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
            <p>{data?.guests} Huéspedes</p>
            <span>·</span>
            <p>{data?.bedrooms} Dormitorios</p>
            <span>·</span>
            <p>{data?.bathrooms} Baños</p>
          </div>

          <div className="flex items-center mt-6">
            <HomeHostInfo
              firstName={data?.User?.firstName}
              userPicture={data?.User?.profileImage}
              createdAt={data?.createdAt}
            />
          </div>

          <Separator className="my-7" />
          <ShowCaseCategory
            categoryName={getPrimaryCategoryName(data?.categoryName)}
            categoryNames={data?.categoryName}
          />
          <Separator className="my-7" />
          <p className="text-muted-foreground">{data?.description}</p>
          <Separator className="my-7" />
          {data?.exactAddress && (
            <>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{data.exactAddress}</span>
              </div>
              <Separator className="my-7" />
            </>
          )}
          <div>
            <h3 className="text-xl font-semibold mb-4">Lo que ofrece este lugar</h3>
            <div className="space-y-6">
              {amenityCategories.map((category: { id: string; name: string; amenities: { id: string; name: string; iconUrl?: string; iconKey?: string; status: string; }[] }) => {
                const available = category.amenities.filter(
                  (amenity) => amenity.status === "YES"
                );
                if (available.length === 0) {
                  return null;
                }
                return (
                  <div key={category.id} className="space-y-3">
                    <h4 className="text-base font-semibold">{category.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {available.map((amenity) => (
                        <div key={amenity.id} className="flex items-center gap-3">
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
              })}
            </div>

            {amenityCategories.some((category: { amenities: { status: string }[] }) =>
              category.amenities.some((amenity) => amenity.status === "NO")
            ) && (
              <div className="mt-8">
                <h4 className="text-base font-semibold mb-3">No incluidos</h4>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                   {amenityCategories.flatMap((category: { amenities: { id: string; name: string; status: string }[] }) =>
                    category.amenities
                      .filter((amenity) => amenity.status === "NO")
                      .map((amenity) => (
                        <span key={amenity.id}>No disponible: {amenity.name}</span>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Separator className="my-7" />
          <HomeMap
            stateValue={state?.value as string}
            municipalityValue={data?.municipality as string}
            exactAddress={data?.exactAddress as string | undefined}
            latitude={data?.latitude as number | undefined}
            longitude={data?.longitude as number | undefined}
          />
        </div>
        <HomeReservationForm
          homeId={params.id}
          userId={user?.id}
          reservation={data?.Reservation}
          price={data?.price as number}
        />
      </div>
    </div>
  );
}

export default SingleHomePage;
