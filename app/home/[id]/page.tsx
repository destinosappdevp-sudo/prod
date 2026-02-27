import HomeMap from "@/app/components/HomeMap";
import { HomeHostInfo } from "@/app/components/HomeHostInfo";
import { HomeReservationForm } from "@/app/components/HomeReservationForm";
import SelectCalendar from "@/app/components/SelectCalendar";
import ShowCaseCategory from "@/app/components/ShowCaseCategory";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import prisma from "@/app/lib/db";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

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

  return categories.map((category) => ({
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
    <div className="w-[75%] mx-auto mt-10 mb-12">
      <h1 className="font-medium text-2xl mb-5">{data?.title}</h1>
      <div className="relative h-[550px]">
        <SupabaseImage
          imagePath={data?.photo as string}
          alt={data?.title as string}
          fill
          className="rounded-lg h-full object-cover w-full"
        />
      </div>

      <div className="flex justify-between gap-x-24 mt-8">
        <div className="w-2/3">
          <h3 className="text-xl font-medium">
            {municipality ? municipality.label : state?.label}
          </h3>
          <div className="flex gap-x-2 text-muted-foreground">
            <p>{data?.guests} Huéspedes</p> · <p>{data?.bedrooms} Dormitorios</p>·{" "}
            {data?.bathrooms} Baños
          </div>

          <div className="flex items-center mt-6">
            <HomeHostInfo
              firstName={data?.User?.firstName}
              userPicture={data?.User?.profileImage}
              createdAt={data?.createdAt}
            />
          </div>

          <Separator className="my-7" />
          <ShowCaseCategory categoryName={data?.categoryName as string} />
          <Separator className="my-7" />
          <p className="text-muted-foreground">{data?.description}</p>
          <Separator className="my-7" />
          <div>
            <h3 className="text-xl font-semibold mb-4">Lo que ofrece este lugar</h3>
            <div className="space-y-6">
              {amenityCategories.map((category) => {
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
                            <img
                              src={amenity.iconUrl}
                              alt={amenity.name}
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

            {amenityCategories.some((category) =>
              category.amenities.some((amenity) => amenity.status === "NO")
            ) && (
              <div className="mt-8">
                <h4 className="text-base font-semibold mb-3">No incluidos</h4>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {amenityCategories.flatMap((category) =>
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
