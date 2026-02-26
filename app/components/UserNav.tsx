/* eslint-disable @next/next/no-img-element */
import { createAirbnbHome } from "../action";
import { UserNavClient } from "./UserNavClient";
import { createClient } from "@/app/lib/supabase/server";

async function UserNav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const createHomeWithId = createAirbnbHome.bind(null, {
    userId: user?.id as string,
  });

  const userPicture =
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
    />
  );
}

export default UserNav;
