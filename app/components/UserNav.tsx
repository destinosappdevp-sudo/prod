/* eslint-disable @next/next/no-img-element */
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createAirbnbHome } from "../action";
import { UserNavClient } from "./UserNavClient";

async function UserNav() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const createHomeWithId = createAirbnbHome.bind(null, {
    userId: user?.id as string,
  });

  const userPicture =
    user?.picture ??
    "https://static.vecteezy.com/system/resources/previews/009/292/244/large_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  return (
    <UserNavClient
      user={user}
      createHomeAction={createHomeWithId}
      userPicture={userPicture}
    />
  );
}

export default UserNav;
