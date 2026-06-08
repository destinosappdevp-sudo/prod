"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  CreditCard,
  BarChart3,
  Settings,
  BookOpen,
  LogOut,
  X,
  PiggyBank,
} from "lucide-react";
import { signOut } from "@/app/action";
import { cn } from "@/lib/utils";
import { SidebarThemeToggle } from "./ThemeToggle";

interface AdminSidebarProps {
  userName?: string;
  role?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
  onCloseMobile?: () => void;
}

const getMenuItems = (role?: string) => {
  const items = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/properties", icon: Home, label: "Paquetes" },
    { href: "/admin/categories", icon: BarChart3, label: "Categorías" },
    { href: "/admin/amenities", icon: Home, label: "Servicios" },
    { href: "/admin/payments", icon: CreditCard, label: "Finanzas" },
    { href: "/admin/savings", icon: PiggyBank, label: "Alcancía" },
  ];
  if (role === "SUPERADMIN") {
    items.splice(1, 0, { href: "/admin/banners", icon: BarChart3, label: "Publicidad" });
    items.push({ href: "/admin/reports", icon: BarChart3, label: "Informes" });
    items.push({ href: "/admin/settings", icon: Settings, label: "Configuración" });
    items.push({ href: "/admin/manual", icon: BookOpen, label: "Manual" });
  }
  if (role === "ADMIN") {
    items.push({ href: "/admin/settings", icon: Settings, label: "Configuración" });
  }
  // Mostrar la opción Manual solo para SUPERADMIN y ADMIN
  if (role === "SUPERADMIN" || role === "ADMIN") {
    if (!items.find((i) => i.href === "/admin/manual")) {
      items.push({ href: "/admin/manual", icon: BookOpen, label: "Manual" });
    }
  }
  return items;
};

export function AdminSidebar({
  userName,
  role,
  mobileOpen = false,
  onNavigate,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems(role);

  return (
    <aside
      id="admin-sidebar-nav"
      className={cn(
        "fixed left-0 top-0 z-[60] flex h-full w-64 flex-col bg-brand-blue text-white shadow-xl transition-transform duration-200 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href="/admin" onClick={onNavigate} className="block">
              <h1 className="text-xl font-bold text-white leading-tight sm:text-2xl">
                Destinos Venezuela Admin
              </h1>
            </Link>
            {role === "SUPERADMIN" && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-amber-400/90">
                Panel Superadmin
              </p>
            )}
            {role === "ADMIN" && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-sky-400/90">
                Panel Administrador
              </p>
            )}
            <p className="mt-1 truncate text-sm text-gray-400">{userName || "Administrator"}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
            onClick={onCloseMobile}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-primary"
              )}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-primary"
        >
          <Home size={20} />
          <span>Volver al sitio</span>
        </Link>
        <SidebarThemeToggle />
        <form action={signOut} className="w-full mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-primary"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}



