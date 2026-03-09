import Image from "next/image";
import Link from "next/link";
import logo from "../../public/screenshot/logodesktop.svg";
import mobileLogo from "../../public/z.webp";
import SearchBox from "./SearchBox";
import UserNav from "./UserNav";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";

async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let userName = "Invitado";
  
  if (user?.id) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true },
    });
    
    if (userRecord?.firstName) {
      userName = userRecord.firstName;
    } else if (user.user_metadata?.first_name) {
      userName = user.user_metadata.first_name;
    } else if (user.email) {
      userName = user.email.split("@")[0];
    }
  }

  return (
    <nav className="w-full border-b bg-white">
      <div className="container mx-auto px-4 sm:px-5 lg:px-10 py-3 lg:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:gap-6">
          <Link href={"/"} className="shrink-0 flex items-center gap-2">
            <Image src={logo} alt="logo" className="w-32 hidden lg:block" />
            <div className="flex items-center gap-2 lg:hidden">
              <Image
                src={mobileLogo}
                alt="Mobile Logo"
                className="w-10"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Hola, {userName}</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-x-3 sm:gap-x-4 shrink-0 lg:order-3">
            <LanguageSwitcher />
            <UserNav />
          </div>

          <div className="w-full order-3 lg:order-2 lg:flex-1 lg:max-w-3xl">
            <SearchBox />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
