/* eslint-disable @next/next/no-img-element */
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import Link from "next/link";

interface UserNavClientProps {
  user: any;
  createHomeAction: (formData: FormData) => Promise<void>;
  userPicture: string;
}

export function UserNavClient({
  user,
  createHomeAction,
  userPicture,
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
            <DropdownMenuItem>
              <form action={createHomeAction} className="w-full">
                <button type="submit" className="w-full text-start">
                  Tu hogar en Airbnb
                </button>
              </form>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/my-listing" className="w-full">
                Mis Anuncios
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/favorites" className="w-full">
                Mis Favoritos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/reservation" className="w-full">
                Mis Reservas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutLink>Cerrar Sesión</LogoutLink>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem>
              <RegisterLink className="w-full">Registrarse</RegisterLink>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LoginLink className="w-full">Iniciar Sesión</LoginLink>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
