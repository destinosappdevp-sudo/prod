"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";

function Navbar() {
  return (
    <header className="w-full border-b border-[#e5e7eb] bg-[#f3f4f6] text-slate-900">
      <div className="mx-auto flex h-[88px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-10">
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
            <p className="text-[20px] font-extrabold tracking-[-0.02em] text-[#111827] sm:text-[22px]">
              Destino&apos;s
            </p>
            <p className="text-[12px] text-slate-600 sm:text-[13px]">
              Tu aventura comienza aquí
            </p>
          </div>
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-[16px] bg-[#E0AE33] px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.14)] transition hover:bg-[#cf9f2f] sm:px-6 sm:py-3 sm:text-[15px]"
        >
          <LogIn size={18} strokeWidth={2.2} />
          Iniciar Sesión
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
