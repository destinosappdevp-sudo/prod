import { createClient } from "@/app/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import ListingCard from "../components/ListingCard";
import { Nothing } from "../components/Nothing";
import prisma from "../lib/db";

async function getData(userId: string) {
  noStore();
  const data = await prisma.favorite.findMany({
    where: {
      userId: userId,
    },
    select: {
      Home: {
        select: {
          photo: true,
          id: true,
          Favorite: true,
          price: true,
          country: true,
          municipality: true,
          title: true,
        },
      },
    },
  });

  return data;
}

async function page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const data = await getData(user.id);
  return (
    <section className="container mx-auto px-5 lg:py-10 mt-10">
      <h2 className="text-3xl font-medium tracking-tight">Mis Favoritos</h2>

      {data.length === 0 ? (
        <Nothing
          title="No has guardado ninguna propiedad en tus favoritos"
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
              favoriteId={item.Home?.Favorite[0].id as string}
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

export default page;
