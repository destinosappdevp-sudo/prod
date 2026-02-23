import { creteReservation } from "@/app/action";
import HomeMap from "@/app/components/HomeMap";
import { HomeHostInfo } from "@/app/components/HomeHostInfo";
import { HomeReservationForm } from "@/app/components/HomeReservationForm";
import SelectCalendar from "@/app/components/SelectCalendar";
import ShowCaseCategory from "@/app/components/ShowCaseCategory";
import prisma from "@/app/lib/db";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { Separator } from "@/components/ui/separator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";

async function getData(homeId: string) {
  noStore();
  const data = await prisma.home.findUnique({
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
      createdAt: true,
      Reservation: {
        where: {
          homeId: homeId,
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

async function SingleHomePage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  const state = getStateByValue(data?.country as string);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <div className="w-[75%] mx-auto mt-10 mb-12">
      <h1 className="font-medium text-2xl mb-5">{data?.title}</h1>
      <div className="relative h-[550px]">
        <Image
          alt={data?.title as string}
          src={`https://gnygijwemqkfceqfmmie.supabase.co/storage/v1/object/public/images/${data?.photo}`}
          fill
          className="rounded-lg h-full object-cover w-full"
        />
      </div>

      <div className="flex justify-between gap-x-24 mt-8">
        <div className="w-2/3">
          <h3 className="text-xl font-medium">
            {state?.label}
          </h3>
          <div className="flex gap-x-2 text-muted-foreground">
            <p>{data?.guests} Guests</p> · <p>{data?.bedrooms} Bedrooms</p>·{" "}
            {data?.bathrooms} Bathrooms
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
          <HomeMap locationValue={state?.value as string} />
        </div>
        <HomeReservationForm
          homeId={params.id}
          userId={user?.id}
          reservation={data?.Reservation}
          creteReservation={creteReservation}
        />
      </div>
    </div>
  );
}

export default SingleHomePage;
