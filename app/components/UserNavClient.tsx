/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Menu, CircleUserRound, HelpCircle, ArrowRight } from "lucide-react";
import { signOut } from "../action";
import { AuthDialog } from "./AuthDialog";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [imgSrc, setImgSrc] = useState<string | null>(userPicture || null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "register">("login");
  const [authDialogRole, setAuthDialogRole] = useState<"GUEST" | "HOST">("GUEST");

  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const menuItemClassName =
    "rounded-lg px-4 py-3 text-sm font-medium text-gray-700 focus:bg-gray-50";

  const menuItemContentClassName = "flex w-full items-center gap-2 text-left";

  useEffect(() => {
    setImgSrc(userPicture || null);
  }, [userPicture]);

  const openLoginDialog = () => {
    setAuthDialogMode("login");
    setAuthDialogRole("GUEST");
    setAuthDialogOpen(true);
  };

  const openRegisterDialog = (role: "GUEST" | "HOST") => {
    setAuthDialogMode("register");
    setAuthDialogRole(role);
    setAuthDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {!user && (
          <button
            onClick={openLoginDialog}
            className="flex items-center gap-2 rounded-full bg-[#E1B042] hover:bg-[#C99A38] px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <ArrowRight size={16} />
            Iniciar Sesión
          </button>
        )}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Abrir menú"
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-2 transition-shadow hover:shadow-md focus:outline-none"
          >
            <Menu size={18} className="text-gray-700" strokeWidth={1.8} />
            {user && imgSrc ? (
              <img
                src={imgSrc}
                alt="avatar"
                onError={() => setImgSrc(null)}
                className="h-7 w-7 rounded-full border border-gray-200 bg-gray-100 object-cover"
              />
            ) : (
              <CircleUserRound size={26} className="text-gray-500" strokeWidth={1.4} />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[220px] rounded-2xl border border-gray-100 py-2 shadow-lg">
          {user ? (
            <>
              <DropdownMenuItem asChild className={menuItemClassName}>
                <Link href="/ayuda" className={menuItemContentClassName}>
                  <HelpCircle size={15} className="text-gray-500" />
                  ayuda
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                disabled
                className="rounded-lg px-4 py-3 text-sm font-semibold text-gray-500 data-[disabled]:opacity-100"
              >
                {userName || "Mi Cuenta"}
              </DropdownMenuItem>

              {userRole === "HOST" && (
                <DropdownMenuItem asChild className={menuItemClassName}>
                  <form action={createHomeAction} className="w-full">
                    <button type="submit" className={menuItemContentClassName}>
                      Publicar en Destinos Venezuela
                    </button>
                  </form>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem asChild className={menuItemClassName}>
                <Link href="/my-dashboard" className={menuItemContentClassName}>
                  Escritorio
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem asChild className={menuItemClassName}>
                <form action={signOut} className="w-full">
                  <button type="submit" className={menuItemContentClassName}>
                    Cerrar Sesión
                  </button>
                </form>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild className={menuItemClassName}>
                <Link href="/ayuda" className={menuItemContentClassName}>
                  <HelpCircle size={15} className="text-gray-500" />
                  ayuda
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onSelect={openLoginDialog}
                className="rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:bg-gray-50"
              >
                Iniciar Sesión
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={() => openRegisterDialog("GUEST")}
                className={menuItemClassName}
              >
                Registrarse
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        nextPath={currentPath}
        initialMode={authDialogMode}
        initialRole={authDialogRole}
      />
    </>
  );
}
