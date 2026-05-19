import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import UserNav from "./UserNav";

async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "usuario";

  if (user?.id) {
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true },
    });

    displayName = userRecord?.firstName
      ? `${userRecord.firstName}`.trim()
      : user?.user_metadata?.first_name
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
      : user?.user_metadata?.full_name
      ? `${user.user_metadata.full_name}`.trim()
      : user?.email?.split("@")[0] || "usuario";
  }

  const firstDisplayName = displayName.split(" ")[0] || "usuario";

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-[#e5e7eb] bg-[#f3f4f6]/95 text-slate-900 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[88px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Image
            src="/media/logo-destinos.webp"
            alt="Logo Destinos"
            width={48}
            height={48}
            className="h-[42px] w-[42px] rounded-full object-cover sm:h-[48px] sm:w-[48px]"
            priority
          />
          <div className="min-w-0 leading-tight">
            {user ? (
              <>
                <p className="text-[11px] font-medium text-slate-500 sm:text-[12px]">Bienvenido,</p>
                <p className="truncate text-[16px] font-extrabold tracking-[-0.02em] text-[#111827] sm:text-[22px]">
                  Hola, {firstDisplayName}! 🌴
                </p>
              </>
            ) : (
              <>
                <p className="text-[20px] font-extrabold tracking-[-0.02em] text-[#111827] sm:text-[22px]">
                  Destino&apos;s
                </p>
                <p className="text-[12px] text-slate-600 sm:text-[13px]">
                  Tu aventura comienza aquí
                </p>
              </>
            )}
          </div>
        </Link>

        {user ? (
          <UserNav />
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-[16px] bg-[#E0AE33] px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.14)] transition hover:bg-[#cf9f2f] sm:px-6 sm:py-3 sm:text-[15px]"
          >
            <LogIn size={18} strokeWidth={2.2} />
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;



