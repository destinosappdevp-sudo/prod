/* eslint-disable @next/next/no-img-element */
import { createAirbnbHome } from "../action";
import { UserNavClient } from "./UserNavClient";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

async function UserNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userRole: string | null = null;
  let userProfileImage: string | null = null;
  
  if (user?.id) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, profileImage: true },
    });
    userRole = userRecord?.role || null;
    userProfileImage = userRecord?.profileImage || null;
  }
  
  const createHomeWithId = createAirbnbHome.bind(null, {
    userId: user?.id as string,
  });

  const userPicture =
    userProfileImage ??
    user?.user_metadata?.avatar_url ??
    "https://static.vecteezy.com/system/resources/previews/009/292/244/large_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  const userName = user?.user_metadata?.first_name ? 
    `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim() :
    user?.email?.split("@")[0];

  return (
    <UserNavClient
      user={user}
      createHomeAction={createHomeWithId}
      userPicture={userPicture}
      userName={userName}
      userRole={userRole}
    />
  );
}

export default UserNav;
