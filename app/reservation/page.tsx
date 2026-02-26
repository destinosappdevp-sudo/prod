import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import ListingCard from "../components/ListingCard";
import { Nothing } from "../components/Nothing";
import prisma from "../lib/db";

async function getData(userId: string) {
  noStore();
  const data = await prisma.reservation.findMany({
    where: {
      userId: userId,
    },
    select: {
      Home: {
        select: {
          id: true,
          country: true,
          photo: true,
          title: true,
          description: true,
          price: true,
          municipality: true,
          Favorite: {
            where: {
              userId: userId,
            },
          },
        },
      },
    },
  });

  return data;
}

async function ReservationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return redirect("/");
  const data = await getData(user.id);

  return (
    <section className="container mx-auto px-5 lg:py-10 mt-10">
      <h2 className="text-3xl font-medium tracking-tight">Mis Reservas</h2>

      {data.length === 0 ? (
        <Nothing
          title="No has realizado ninguna reserva aún"
          description="Esperamos que llenes esto con los lugares que quieres visitar ❤️"
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-8 mt-8">
          {data.map((item) => (
            <ListingCard
              key={item.Home?.id}
              title={item.Home?.title as string}
              stateValue={item.Home?.country as string}
              municipalityValue={item.Home?.municipality}
              price={item.Home?.price as number}
              pathName="/favorites"
              homeId={item.Home?.id as string}
              imagePath={item.Home?.photo as string}
              userId={user.id}
              favoriteId={item.Home?.Favorite[0]?.id as string}
              isInFavoriteList={
                (item.Home?.Favorite.length as number) > 0 ? true : false
              }
              description=""
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default ReservationPage;
