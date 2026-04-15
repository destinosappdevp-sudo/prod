"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  role?: string;
  /** Contenido del header (p. ej. UserNav desde el layout servidor). */
  headerRight?: React.ReactNode;
}

export function AdminShell({ children, userName, role, headerRight }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);
  const firstDisplayName = (userName || "usuario").trim().split(" ")[0] || "usuario";

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={closeMobile}
        />
      )}

      <AdminSidebar
        userName={userName}
        role={role}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
        onCloseMobile={closeMobile}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:ml-64">
        <div className="sticky top-0 z-40 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur md:px-8">
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="admin-sidebar-nav"
            aria-label={mobileOpen ? "Cerrar menú de administración" : "Abrir menú de administración"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Bienvenido,</p>
            <h2 className="truncate text-lg font-bold text-slate-900 md:text-2xl">
              Hola, {firstDisplayName}! 🌴
            </h2>
          </div>
          <div className="ml-auto flex items-center justify-end">{headerRight}</div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
