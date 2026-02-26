/* eslint-disable @next/next/no-img-element */
"use client";

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
  userPicture: string;
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <img
          src={userPicture}
          alt="Pic of user"
          className="rounded-full h-10 w-10 border border-gray-300 cursor-pointer hover:opacity-80 transition"
        />
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
                    🔐 Panel de Admin
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
