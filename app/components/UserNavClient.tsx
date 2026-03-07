/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { signOut } from "../action";

interface UserNavClientProps {
  user: any;
  createHomeAction: (formData: FormData) => Promise<void>;
  userPicture: string | null;
  userName?: string;
  userRole?: string | null;
}

export function UserNavClient({
  user,
  createHomeAction,
  userPicture,
  userName,
  userRole,
}: UserNavClientProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(userPicture || null);

  useEffect(() => {
    setImgSrc(userPicture || null);
  }, [userPicture]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Pic of user"
            onError={() => setImgSrc(null)}
            className="rounded-full h-10 w-10 border border-gray-300 cursor-pointer hover:opacity-80 transition object-cover bg-gray-100"
          />
        ) : (
          <div className="rounded-full h-10 w-10 border border-gray-300 cursor-pointer hover:opacity-80 transition bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        {user ? (
          <>
            <DropdownMenuItem disabled className="font-semibold text-sm">
              {userName || "Mi Cuenta"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {userRole === "HOST" && (
              <DropdownMenuItem>
                <form action={createHomeAction} className="w-full">
                  <button type="submit" className="w-full text-start">
                    Publicar en Zerkka
                  </button>
                </form>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Link href="/my-dashboard" className="w-full">
                Escritorio
              </Link>
            </DropdownMenuItem>
            {(userRole === "ADMIN" || userRole === "SUPERADMIN") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/admin" className="w-full font-semibold text-blue-600">
                    🏠 Panel de Admin
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-start">
                  Cerrar Sesión
                </button>
              </form>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem>
              <Link href="/login" className="w-full">
                Iniciar Sesión
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/login" className="w-full">
                Registrarse
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
