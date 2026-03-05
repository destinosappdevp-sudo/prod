import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import prisma from "../lib/db";
import { User, Mail, Calendar, Home, Heart, BookmarkCheck } from "lucide-react";
import ProfileEditClient from "../components/ProfileEditClient";

export const dynamic = "force-dynamic";

async function getUserData(userId: string) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Home: {
        where: {
          addedCategory: true,
          addedDescription: true,
          addedLocation: true,
        },
      },
      Favorite: true,
      Reservation: true,
    },
  });
  
  return userData as any;
}

async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userData = await getUserData(user.id);

  return (
    <section className="container mx-auto px-5 lg:px-10 mt-10 mb-12">
      <ProfileEditClient userData={userData} userId={user.id} />

      <div className="max-w-4xl mx-auto mt-8">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Home className="w-4 h-4" />
                Anuncios Publicados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userData?.Home.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favoritos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userData?.Favorite.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4" />
                Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userData?.Reservation.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la cuenta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Nombre completo</p>
              <p className="text-base">{userData?.firstName} {userData?.lastName}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Correo electrónico</p>
              <p className="text-base">{userData?.email}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Número Telefónico</p>
              <p className="text-base">{userData?.phoneNumber || "No especificado"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">ID de usuario</p>
              <p className="text-base font-mono text-sm">{userData?.id}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default ProfilePage;
