"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  CreditCard,
  PiggyBank,
  Smartphone,
  BarChart3,
  Settings,
  LogOut,
  X,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { signOut } from "@/app/action";
import { cn } from "@/lib/utils";
import { SidebarThemeToggle } from "./ThemeToggle";

interface AdminSidebarProps {
  userName?: string;
  role?: string;
  mobileOpen?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}

const getMenuItems = () => {
  return [
    { href: "/admin", icon: LayoutDashboard, label: "Panel" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/destinos", icon: MapPin, label: "Destinos" },
    { href: "/admin/payments", icon: CreditCard, label: "Pagos" },
    { href: "/admin/savings", icon: PiggyBank, label: "Alcancía" },
    { href: "/admin/pagomovil", icon: Smartphone, label: "R4" },
    { href: "/admin/reports", icon: BarChart3, label: "Informes" },
    { href: "/admin/configuracion", icon: Settings, label: "Configuración" },
  ];
};

export function AdminSidebar({
  userName,
  role,
  mobileOpen = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems();
  const isCollapsed = collapsed;

  return (
    <aside
      id="admin-sidebar-nav"
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-screen flex-col bg-card text-foreground border-r border-border shadow-xl transition-all duration-200 ease-out overflow-hidden",
        isCollapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="border-b border-border shrink-0">
        <div className={cn("flex items-center", isCollapsed ? "justify-center p-3" : "justify-between p-6")}>
          {isCollapsed ? (
            <Link href="/admin" onClick={onNavigate} className="block">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                D
              </div>
            </Link>
          ) : (
            <div className="min-w-0">
              <Link href="/admin" onClick={onNavigate} className="block">
                <h1 className="text-xl font-bold text-foreground leading-tight sm:text-2xl truncate">
                  Admin
                </h1>
              </Link>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary truncate">
                {role === "SUPERADMIN" ? "Superadmin" : role === "ADMIN" ? "Admin" : ""}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {userName || "Administrator"}
              </p>
            </div>
          )}
          <button
            type="button"
            aria-label="Cerrar menú"
            className={cn(
              "shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground",
              isCollapsed ? "hidden" : "lg:hidden",
            )}
            onClick={onCloseMobile}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin" || pathname === "/admin/banners"
              : pathname.startsWith(item.href) ||
                (item.href === "/admin/destinos" &&
                  ["/admin/properties", "/admin/pasadas", "/admin/categories", "/admin/amenities"].includes(pathname)) ||
                (item.href === "/admin/configuracion" &&
                  ["/admin/settings", "/admin/manual"].includes(pathname));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-lg transition-colors",
                isCollapsed
                  ? "justify-center p-3 mx-auto"
                  : "gap-3 px-4 py-3",
                isActive
                  ? "bg-primary-soft text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          );
        })}

        <div className="pt-2">
          <Link
            href="/"
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              isCollapsed ? "justify-center p-3 mx-auto" : "gap-3 px-4 py-3",
            )}
            title={isCollapsed ? "Volver al sitio" : undefined}
          >
            <Home size={20} />
            {!isCollapsed && <span className="font-medium truncate">Volver al sitio</span>}
          </Link>
          {isCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center rounded-lg p-3 mx-auto text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              title="Expandir menú"
            >
              <ChevronRight size={20} />
            </button>
          ) : (
            <>
              <SidebarThemeToggle />
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <LogOut size={20} />
                  <span className="font-medium truncate">Cerrar sesión</span>
                </button>
              </form>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Contraer menú"
              >
                <ChevronLeft size={20} />
                <span className="font-medium truncate">Contraer</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}
