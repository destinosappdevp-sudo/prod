import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "../lib/db";
import ProfileEditClient from "../components/ProfileEditClient";
import { UserDocumentItem } from "@/app/components/DocumentsSection";

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

async function getUserDocuments(userId: string) {
  return prisma.$queryRawUnsafe(
    'SELECT id, "userId", url, "fileName", "fileSize", "mimeType", "uploadedAt" FROM "UserDocument" WHERE "userId" = $1 ORDER BY "uploadedAt" DESC',
    userId
  ) as Promise<UserDocumentItem[]>;
}

async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userData = await getUserData(user.id);
  const userDocuments = await getUserDocuments(user.id);

  return (
    <section className="container mx-auto px-5 lg:px-10 mt-10 mb-12">
      <ProfileEditClient userData={userData} userId={user.id} initialDocs={userDocuments} />
    </section>
  );
}

export default ProfilePage;
