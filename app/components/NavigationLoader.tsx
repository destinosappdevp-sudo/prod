"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Interceptar clics en links internos (Next.js <Link>)
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("http://") ||
        href.startsWith("https://")
      ) return;
      if (anchor.getAttribute("target") === "_blank") return;
      setLoading(true);
    };

    // Interceptar envíos de formularios (login, registro, etc.)
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const action = form.getAttribute("action");
      // Solo formularios que navegan (no los de server actions que devuelven JSON)
      if (action && (action.startsWith("/") || !action)) {
        setLoading(true);
      } else if (!action) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  // Ocultar cuando termina la navegación (cambia el pathname o los search params)
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Fallback: ocultar después de 1.5s por si algo falla
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/75 backdrop-blur-sm">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin-fast" />
        <span className="text-orange-500 font-black text-5xl leading-none select-none">
          D
        </span>
      </div>
    </div>
  );
}
