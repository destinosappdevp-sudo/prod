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
import { CircleUserRound, PiggyBank, ArrowRight } from "lucide-react";
import { signOut } from "../action";
import { AuthDialog } from "./AuthDialog";

interface UserNavClientProps {
  user: any;
  userPicture: string | null;
  userName?: string;
  userRole?: string | null;
}

export function UserNavClient({
  user,
  userPicture,
  userName,
  userRole,
}: UserNavClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [imgSrc, setImgSrc] = useState<string | null>(userPicture || null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "register">("login");
  const [authDialogRole, setAuthDialogRole] = useState<"GUEST">("GUEST");

  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  const menuItemClassName =
    "rounded-lg px-4 py-3 text-sm font-medium text-gray-700 focus:bg-gray-50";

  const menuItemContentClassName = "flex w-full items-center gap-2 text-left";
  const userInitials = (userName || "Usuario")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "US";

  useEffect(() => {
    setImgSrc(userPicture || null);
  }, [userPicture]);

  const openLoginDialog = () => {
    setAuthDialogMode("login");
    setAuthDialogRole("GUEST");
    setAuthDialogOpen(true);
  };

  const openRegisterDialog = (role: "GUEST") => {
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
            className="flex items-center gap-2 rounded-full bg-[#E1B042] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C99A38]"
          >
            <ArrowRight size={16} />
            Iniciar Sesión
          </button>
        )}
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Abrir menú"
            className="flex items-center rounded-full bg-transparent transition-opacity hover:opacity-90 focus:outline-none"
          >
            {user ? (
              imgSrc ? (
                <img
                  src={imgSrc}
                  alt="avatar"
                  onError={() => setImgSrc(null)}
                  className="h-11 w-11 rounded-full border border-[#E0AE33]/30 bg-gray-100 object-cover"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E0AE33]/30 bg-[#F7E7B6] text-sm font-bold text-[#8A6500]">
                  {userInitials}
                </span>
              )
            ) : (
              <CircleUserRound size={26} className="text-gray-500" strokeWidth={1.4} />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[220px] rounded-2xl border border-gray-100 py-2 shadow-lg">
          {user ? (
            <>
              <DropdownMenuItem asChild className={menuItemClassName}>
                <Link href="/my-dashboard?tab=mi-alcancia" className={menuItemContentClassName}>
                  <PiggyBank size={15} className="text-gray-500" />
                  Mis Ahorros
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                disabled
                className="rounded-lg px-4 py-3 text-sm font-semibold text-gray-500 data-[disabled]:opacity-100"
              >
                {userName || "Mi Cuenta"}
              </DropdownMenuItem>

<DropdownMenuItem asChild className={menuItemClassName}>
                <Link href={userRole === "ADMIN" || userRole === "SUPERADMIN" ? "/admin" : "/my-dashboard"} className={menuItemContentClassName}>
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
                <Link href="/login?next=%2Fmy-dashboard%3Ftab%3Dmi-alcancia" className={menuItemContentClassName}>
                  <PiggyBank size={15} className="text-gray-500" />
                  Mis Ahorros
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onSelect={openLoginDialog}
                className="rounded-lg px-4 py-3 text-sm font-medium text-gray-800 focus:bg-gray-50"
              >
                Iniciar Sesi�n
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



