import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function ProfilePage() {
  redirect("/my-dashboard?tab=profile");
}

export default ProfilePage;
