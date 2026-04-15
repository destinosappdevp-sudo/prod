/* eslint-disable @next/next/no-img-element */
import { UserNavClient } from "./UserNavClient";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

async function UserNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userRole: string | null = null;
  let userProfileImage: string | null = null;
  let dbFirstName: string | null = null;
  let dbLastName: string | null = null;
  
  if (user?.id) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, profileImage: true, firstName: true, lastName: true },
    });
    userRole = userRecord?.role || null;
    userProfileImage = userRecord?.profileImage || null;
    dbFirstName = userRecord?.firstName || null;
    dbLastName = userRecord?.lastName || null;
  }
  
  const isRealPhoto = (url?: string | null) => !!url && !url.includes('avatar.vercel.sh');

  const userPicture = isRealPhoto(userProfileImage)
    ? userProfileImage!
    : isRealPhoto(user?.user_metadata?.avatar_url)
    ? user!.user_metadata.avatar_url
    : null;

  const userName = dbFirstName
    ? `${dbFirstName} ${dbLastName || ""}`.trim()
    : user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
    : user?.email?.split("@")[0];

  return (
    <UserNavClient
      user={user}
      userPicture={userPicture}
      userName={userName}
      userRole={userRole}
    />
  );
}

export default UserNav;
