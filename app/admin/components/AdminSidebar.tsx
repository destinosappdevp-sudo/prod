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
  LogOut
} from "lucide-react";
import { signOut } from "@/app/action";

interface AdminSidebarProps {
  userName?: string;
  role?: string;
}


const getMenuItems = (role?: string) => {
  if (role === "BANER") {
    return [
      { href: "/admin/banners", icon: BarChart3, label: "Publicidad" },
    ];
  }
  const items = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/properties", icon: Home, label: "Propiedades" },
    { href: "/admin/categories", icon: BarChart3, label: "Categorías" },
    { href: "/admin/amenities", icon: Home, label: "Servicios" },
    { href: "/admin/payments", icon: CreditCard, label: "Pagos & Reservas" },
    { href: "/admin/reports", icon: BarChart3, label: "Informes" },
    { href: "/admin/settings", icon: Settings, label: "Configuración" },
  ];
  if (role === "SUPERADMIN") {
    items.splice(1, 0, { href: "/admin/banners", icon: BarChart3, label: "Publicidad" });
  }
  return items;
};

export function AdminSidebar({ userName, role }: AdminSidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems(role);

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/admin">
          <h1 className="text-2xl font-bold text-white">Zerkka Admin</h1>
        </Link>
        <p className="text-sm text-gray-400 mt-1">{userName || "Administrator"}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-primary"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/"
          className="mb-2 flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-primary"
        >
          <Home size={20} />
          <span>Volver al sitio</span>
        </Link>
        <form action={signOut} className="w-full">
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
