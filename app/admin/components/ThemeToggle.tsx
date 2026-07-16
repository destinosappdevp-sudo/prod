"use client";

import { Moon, Sun } from "lucide-react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as Theme | null;
    const preferred = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(preferred ? "dark" : "light");
    document.documentElement.classList.toggle("dark", preferred);
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("admin-theme", next);
      return next;
    });
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-amber-500 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function SidebarThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-primary"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      <span className="font-medium">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>
    </button>
  );
}
