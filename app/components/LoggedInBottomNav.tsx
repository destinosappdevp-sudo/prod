"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Home, PiggyBank, PlusCircle, User } from "lucide-react";

interface LoggedInBottomNavProps {
  isLoggedIn: boolean;
}

const items = [
  { key: "home", label: "Inicio", href: "/", icon: Home },
  { key: "favorites", label: "Favoritos", href: "/my-dashboard?tab=favorites", icon: Heart },
  { key: "wallet", label: "Mi Alcancía", href: "/my-dashboard?tab=mi-alcancia", icon: PiggyBank },
  { key: "save", label: "Ahorrar", href: "/my-dashboard/ahorrar", icon: PlusCircle },
  { key: "profile", label: "Perfil", href: "/my-dashboard?tab=profile", icon: User },
] as const;

export default function LoggedInBottomNav({ isLoggedIn }: LoggedInBottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.key === "home" && pathname === "/") ||
            (item.key === "favorites" && pathname.startsWith("/my-dashboard") && activeTab === "favorites") ||
            (item.key === "wallet" && pathname.startsWith("/my-dashboard") && activeTab === "mi-alcancia") ||
            (item.key === "save" && pathname.startsWith("/my-dashboard/ahorrar")) ||
            (item.key === "profile" && pathname.startsWith("/my-dashboard") && activeTab === "profile");

          return (
            <Link
              key={item.key}
              href={item.href}
              className="relative flex h-full flex-1 touch-manipulation flex-col items-center justify-center gap-1 transition"
            >
              <Icon size={21} className={isActive ? "text-orange-500" : "text-slate-400"} />
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? "text-orange-500" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



