"use client";

import { Suspense, useState } from "react";
import { signUpWithRole, signInWithEmail } from "@/app/action";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState<"GUEST" | "HOST">("GUEST");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);

  const getOrCreateDeviceId = () => {
    const existingDeviceId = localStorage.getItem("xerkka_device_id");
    if (existingDeviceId) {
      return existingDeviceId;
    }

    const newDeviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("xerkka_device_id", newDeviceId);
    return newDeviceId;
  };

  const detectBrowser = (userAgent: string) => {
    if (userAgent.includes("Edg")) return "Edge";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Chrome")) return "Chrome";
    return "Unknown";
  };

  const detectOS = (userAgent: string) => {
    if (userAgent.includes("Windows NT 10.0")) return "Windows 10/11";
    if (userAgent.includes("Mac OS X")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    return "Unknown";
  };

  const getIpAndLocation = async () => {
    let ipAddress: string | null = null;
    let location: string | null = null;

    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        ipAddress = ipData?.ip ?? null;
      }
    } catch {
      ipAddress = null;
    }

    if (ipAddress) {
      try {
        const locationResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (locationResponse.ok) {
          const locationData = await locationResponse.json();
          if (locationData?.city && locationData?.country_name) {
            location = `${locationData.city}, ${locationData.country_name}`;
          }
        }
      } catch {
        location = null;
      }
    }

    return { ipAddress, location };
  };

  const trackActiveSession = async (fallbackUserId?: string) => {
    try {
      const supabase = createClient();
      const deviceId = getOrCreateDeviceId();
      const userAgent = navigator.userAgent;
      const browser = detectBrowser(userAgent);
      const os = detectOS(userAgent);
      const { ipAddress, location } = await getIpAndLocation();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userId = user?.id ?? fallbackUserId;

      if (!userId) {
        return;
      }

      await supabase.from("usersessions").upsert(
        {
          user_id: userId,
          device_id: deviceId,
          device_name: `${browser} en ${os}`,
          os,
          browser,
          ip_address: ipAddress,
          location,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          is_active: true,
        },
        {
          onConflict: "user_id,device_id",
        }
      );
    } catch (sessionError) {
      console.error("No se pudo registrar la sesión activa:", sessionError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isLogin) {
      const result = await signInWithEmail(email, password);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        await trackActiveSession(result.userId);
        router.push(nextPath);
        router.refresh();
      }
    } else {
      const result = await signUpWithRole(email, password, role);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("¡Cuenta creada! Por favor inicia sesión.");
        setIsLogin(true);
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setResetting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message || "Error al enviar el email de recuperación");
      } else {
        setSuccess("¡Email de recuperación enviado! Revisa tu bandeja de entrada.");
        setResetEmail("");
        setTimeout(() => setShowForgotPassword(false), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Iniciar Sesión" : "Crear Cuenta"}</CardTitle>
          <CardDescription>
            {isLogin ? "Ingresa con tu email y contraseña" : "Registra una nueva cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa tu email y te enviaremos un enlace para resetear tu contraseña.
              </p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {success}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={resetting}>
                {resetting ? "Enviando..." : "Enviar Email de Recuperación"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError("");
                  setSuccess("");
                  setResetEmail("");
                }}
                className="w-full text-sm text-gray-600 hover:underline"
              >
                Volver al login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de cuenta</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => setRole(value as "GUEST" | "HOST")}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GUEST">Huesped</SelectItem>
                      <SelectItem value="HOST">Anfitrion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  {success}
                </div>
              )}

              <Button type="submit" className="w-full">
                {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
              </Button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-sm text-blue-600 hover:underline"
                >
                  ¿Olvidaste la contraseña?
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-sm text-gray-600 hover:underline"
              >
                {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
