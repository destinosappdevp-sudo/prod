"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  CreditCard, 
  BarChart3,
  CheckCircle,
  Settings,
  LogOut
} from "lucide-react";
import { signOut } from "@/app/action";

interface AdminSidebarProps {
  userName?: string;
  role?: string;
}


const getMenuItems = (role?: string) => {
  if (role === "BANNER") {
    return [
      { href: "/admin/banners", icon: BarChart3, label: "Banners" },
    ];
  }
  const items = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/approvals", icon: CheckCircle, label: "Aprobaciones" },
    { href: "/admin/properties", icon: Home, label: "Propiedades" },
    { href: "/admin/amenities", icon: Home, label: "Servicios" },
    { href: "/admin/payments", icon: CreditCard, label: "Pagos & Reservas" },
    { href: "/admin/reports", icon: BarChart3, label: "Informes" },
    { href: "/admin/settings", icon: Settings, label: "Configuración" },
  ];
  if (role === "SUPERADMIN") {
    items.splice(1, 0, { href: "/admin/banners", icon: BarChart3, label: "Banners" });
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
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
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
          className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-2"
        >
          <Home size={20} />
          <span>Volver al sitio</span>
        </Link>
        <form action={signOut} className="w-full">
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
