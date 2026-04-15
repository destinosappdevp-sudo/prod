"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPanel } from "@/app/components/AuthPanel";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/my-dashboard";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const initialRole = "GUEST";

  return (
    <AuthPanel
      variant="page"
      initialMode={initialMode}
      initialRole={initialRole}
      nextPath={nextPath}
    />
  );
}
