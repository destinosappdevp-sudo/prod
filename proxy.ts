import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/app/lib/supabase/middleware";

const MAINTENANCE_BYPASS = [
  "/mantenimiento",
  "/login",
  "/auth",
  "/admin",
  "/my-dashboard",
  "/_next",
  "/api",
  "/favicon",
  "/R4consulta",
  "/R4notifica",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Saltar rutas excluidas del modo mantenimiento
  const isBypassed = MAINTENANCE_BYPASS.some((p) => pathname.startsWith(p));

  if (!isBypassed) {
    try {
      const res = await fetch(
        new URL("/api/maintenance-status", request.url),
        {
          cache: "no-store",
          headers: {
            // Reenviar cookies para que el API pueda identificar al usuario
            cookie: request.headers.get("cookie") ?? "",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.maintenanceMode) {
          // Verificar si es admin via cookie de sesion
          const isAdmin = data.isAdmin ?? false;
          if (!isAdmin) {
            return NextResponse.redirect(new URL("/mantenimiento", request.url));
          }
        }
      }
    } catch {
      // Si falla, no bloquear
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
