"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, EyeOff, Home, UserRound } from "lucide-react";
import { signInWithEmail, signUpWithRole } from "@/app/action";
import { createClient } from "@/app/lib/supabase/client";
import { getAllStates } from "@/app/lib/venezuelaStates";
import { getMunicipalitiesByState } from "@/app/lib/venezuelaMunicipalities";
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
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";
type AuthRole = "GUEST";

interface AuthPanelProps {
  initialMode?: AuthMode;
  initialRole?: AuthRole;
  nextPath?: string;
  onSuccess?: () => void;
  onClose?: () => void;
  variant?: "page" | "dialog";
}

export function AuthPanel({
  initialMode = "login",
  initialRole = "GUEST",
  nextPath = "/",
  onSuccess,
  onClose,
  variant = "page",
}: AuthPanelProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [municipalityCode, setMunicipalityCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stateOptions = getAllStates();
  const registerTitle = "Crear Cuenta";

  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode]);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

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

  const getIpAndLocation = async (): Promise<{ ipAddress: string | null; location: string | null }> => {
    // Evitamos llamadas externas aquí para no frenar el inicio de sesión.
    return { ipAddress: null, location: null };
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

      const { error: sessionWriteError } = await supabase.from("usersessions").upsert(
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

      if (sessionWriteError) {
        console.warn("No se pudo registrar la sesión activa:", sessionWriteError.message);
      }
    } catch (sessionError) {
      console.error("No se pudo registrar la sesión activa:", sessionError);
    }
  };

  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const toggleMode = () => {
    resetFeedback();
    setIsLogin((currentValue) => !currentValue);
  };

  const resolveGuestDestination = () => {
    if (
      !nextPath ||
      nextPath === "/" ||
      nextPath.startsWith("/login") ||
      nextPath.startsWith("/admin")
    ) {
      return "/my-dashboard";
    }

    return nextPath;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFeedback();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = await signInWithEmail(email, password);

        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.success) {
          onSuccess?.();
          const adminRoles = ["ADMIN", "SUPERADMIN"];
          const dest =
            "role" in result &&
            typeof result.role === "string" &&
            adminRoles.includes(result.role)
              ? "/admin"
              : resolveGuestDestination();

          router.replace(dest);
          window.setTimeout(() => {
            void trackActiveSession(result.userId);
          }, 0);
        }

        return;
      }

      if (!acceptedTerms) {
        setError("Debes aceptar los Términos y Condiciones para continuar.");
        return;
      }

      const result = await signUpWithRole(email, password, role, {
        firstName,
        lastName,
        phoneNumber,
        stateCode,
        municipalityCode,
      });
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }

      setSuccess("¡Cuenta creada! Redirigiendo...");
      const loginResult = await signInWithEmail(email, password);

      if (loginResult?.success) {
        onSuccess?.();
        router.replace("/my-dashboard?tab=profile");
        window.setTimeout(() => {
          void trackActiveSession(loginResult.userId);
        }, 0);
      } else {
        setSuccess("¡Cuenta creada! Por favor inicia sesión.");
        setIsLogin(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    variant === "dialog"
      ? "h-12 rounded-2xl border-gray-300 px-4 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:ring-offset-0"
      : undefined;

  const selectClassName =
    variant === "dialog"
      ? "h-12 rounded-2xl border-gray-300 px-4 text-base shadow-sm focus:ring-1 focus:ring-orange-500 focus:ring-offset-0"
      : undefined;

  const roleCardClassName =
    "w-full rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1";

  const formBody = (
    <form onSubmit={handleSubmit} className={cn("space-y-4", variant === "dialog" && "space-y-4") }>
      {!isLogin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`auth-first-name-${variant}`}>Nombre</Label>
            <Input
              id={`auth-first-name-${variant}`}
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required={!isLogin}
              placeholder="Juan"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`auth-last-name-${variant}`}>Apellido</Label>
            <Input
              id={`auth-last-name-${variant}`}
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required={!isLogin}
              placeholder="Pérez"
              className={inputClassName}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`auth-email-${variant}`}>Correo electrónico</Label>
        <Input
          id={`auth-email-${variant}`}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="tu@email.com"
          className={inputClassName}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`auth-password-${variant}`}>Contraseña</Label>
        <div className="relative">
          <Input
            id={`auth-password-${variant}`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="••••••••"
            minLength={6}
            className={cn("pr-10", inputClassName)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isLogin && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`auth-phone-${variant}`}>Teléfono</Label>
            <Input
              id={`auth-phone-${variant}`}
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required={!isLogin}
              placeholder="0414-1234567"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`auth-state-${variant}`}>Estado</Label>
            <Select
              value={stateCode}
              onValueChange={(value) => {
                setStateCode(value);
                setMunicipalityCode(""); // Reset municipio al cambiar estado
              }}
            >
              <SelectTrigger id={`auth-state-${variant}`} className={selectClassName}>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {stateOptions.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {stateCode && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`auth-municipality-${variant}`}>Municipio</Label>
              <Select value={municipalityCode} onValueChange={setMunicipalityCode}>
                <SelectTrigger id={`auth-municipality-${variant}`} className={selectClassName}>
                  <SelectValue placeholder="Selecciona municipio..." />
                </SelectTrigger>
                <SelectContent>
                  {getMunicipalitiesByState(stateCode).map((municipality) => (
                    <SelectItem key={municipality.value} value={municipality.value}>
                      {municipality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {!isLogin && (
        <label className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span>
            Acepto haber leído los{' '}
            <Link
              href="/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline"
            >
              Términos y Condiciones
            </Link>
            .
          </span>
        </label>
      )}

      {error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {success && <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-600">{success}</div>}

      <Button
        type="submit"
        disabled={isSubmitting || (!isLogin && !acceptedTerms)}
        className={cn(
          "w-full",
          variant === "dialog" &&
            "h-11 rounded-2xl bg-[#E1B042] text-base font-semibold text-white hover:bg-[#C99A38]"
        )}
      >
        {isSubmitting
          ? "Procesando..."
          : isLogin
          ? "Iniciar sesión"
          : "Crear cuenta"}
      </Button>

      {isLogin && (
        <div className="text-center">
          <span
            role="link"
            tabIndex={0}
            onClick={() => {
              onClose?.();
              router.push("/auth/forgot-password");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose?.();
                router.push("/auth/forgot-password");
              }
            }}
            className="cursor-pointer text-sm font-medium text-[#040B42] hover:underline"
          >
            ¿Olvidaste la contraseña?
          </span>
        </div>
      )}

      <div className="text-center">
        <span
          role="button"
          tabIndex={0}
          onClick={toggleMode}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleMode();
            }
          }}
          className="cursor-pointer text-sm font-medium text-[#040B42] hover:underline"
        >
          {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
        </span>
      </div>
    </form>
  );

  if (variant === "dialog") {
    return (
      <div className="px-5 pb-6 pt-6 md:px-8 md:pb-8 md:pt-7">
        <div className="mb-4 text-center md:mb-5">
          <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            {isLogin ? "Iniciar sesión" : registerTitle}
          </h2>
        </div>
        {formBody}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Iniciar Sesión" : registerTitle}</CardTitle>
          <CardDescription>
            {isLogin ? "Ingresa con tu email y contraseña" : "Registra una nueva cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent>{formBody}</CardContent>
      </Card>
    </div>
  );
}