import Image from "next/image";
import Link from "next/link";
import UserNav from "./UserNav";
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
            <Image
              src="/logo.png"
              alt="logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-gray-900">Destino&apos;s</span>
              <span className="text-xs text-gray-500">Tu aventura comienza aquí</span>
            </div>
          </Link>

          <div className="flex items-center gap-x-3 sm:gap-x-4 shrink-0">
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
