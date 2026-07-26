"use client";

import { useEffect, useState } from "react";
import { Menu, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { ThemeProvider } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  role?: string;
  headerRight?: React.ReactNode;
}

export function AdminShell({ children, userName, role, headerRight }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  };

  const closeMobile = () => setMobileOpen(false);
  const firstDisplayName = (userName || "usuario").trim().split(" ")[0] || "usuario";

  return (
    <ThemeProvider>
      <div className="fixed inset-0 z-50 flex bg-background overflow-x-hidden">
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
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleCollapse}
          onNavigate={closeMobile}
          onCloseMobile={closeMobile}
        />

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-200 ease-out",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
          )}
        >
          <div className="sticky top-0 z-40 flex shrink-0 items-center gap-3 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur md:px-6">
            <button
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="admin-sidebar-nav"
              aria-label={mobileOpen ? "Cerrar menú de administración" : "Abrir menú de administración"}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent lg:inline-flex"
              onClick={toggleCollapse}
            >
              {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Bienvenido,</p>
              <h2 className="truncate text-lg font-bold text-foreground md:text-2xl">
                Hola, {firstDisplayName}! 🌴
              </h2>
            </div>
            <div className="ml-auto flex items-center justify-end gap-1">
              {headerRight}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}
