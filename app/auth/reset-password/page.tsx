"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50">Cargando...</div>}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [sessionInvalid, setSessionInvalid] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const invalidMessage =
        "El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.";

      try {
        const supabase = createClient();
        const {
          data: { session: existingSession },
          error: existingSessionError,
        } = await supabase.auth.getSession();

        if (existingSessionError) {
          throw existingSessionError;
        }

        if (existingSession) {
          if (!isMounted) return;
          setSessionInvalid(false);
          setError("");
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            if (!isMounted) return;
            setSessionInvalid(true);
            setError(invalidMessage);
            return;
          }

          const {
            data: { session: exchangedSession },
            error: exchangedSessionError,
          } = await supabase.auth.getSession();

          if (exchangedSessionError || !exchangedSession) {
            if (!isMounted) return;
            setSessionInvalid(true);
            setError(invalidMessage);
            return;
          }

          if (!isMounted) return;
          setSessionInvalid(false);
          setError("");
          return;
        }

        if (tokenHash) {
          const otpType: EmailOtpType = "recovery";
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });

          if (verifyError) {
            if (!isMounted) return;
            setSessionInvalid(true);
            setError(invalidMessage);
            return;
          }

          const {
            data: { session: verifiedSession },
            error: verifiedSessionError,
          } = await supabase.auth.getSession();

          if (verifiedSessionError || !verifiedSession) {
            if (!isMounted) return;
            setSessionInvalid(true);
            setError(invalidMessage);
            return;
          }

          if (!isMounted) return;
          setSessionInvalid(false);
          setError("");
          return;
        }

        if (!isMounted) return;
        setSessionInvalid(true);
        setError(invalidMessage);
      } catch (err: any) {
        if (!isMounted) return;
        setSessionInvalid(true);
        setError(err?.message || "Error al verificar la sesión");
      } finally {
        if (isMounted) {
          setSessionChecked(true);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [tokenHash, code]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sessionInvalid) {
      return;
    }

    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Error al cambiar la contraseña");
      } else {
        setSuccess("¡Contraseña cambiada exitosamente! Redirigiendo...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Solicitar nuevo enlace
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cambiar contraseña</h1>
            <p className="text-slate-600 mt-2">Define una nueva contraseña segura para tu cuenta.</p>
          </div>

          {!sessionChecked && (
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-lg mb-5">
              Verificando enlace de recuperación...
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg mb-5">
              {success}
            </div>
          )}

          {sessionChecked && !sessionInvalid && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="********"
                    minLength={8}
                    className="pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="********"
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? "Actualizando..." : "Cambiar contraseña"}
                </Button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Volver al login
                </button>
              </div>
            </form>
          )}

          {sessionChecked && sessionInvalid && (
            <div className="pt-1">
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Solicitar otro enlace
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Seguridad de cuenta</p>
              <p className="text-sm text-slate-600 mt-1">
                Usa una contraseña única con al menos 8 caracteres y evita reutilizar claves de otros servicios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



