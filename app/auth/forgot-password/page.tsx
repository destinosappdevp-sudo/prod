"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al enviar el email de recuperación");
      } else {
        setSuccess("Te enviamos un enlace para cambiar tu contraseña.");
        setEmail("");
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
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Recuperar contraseña</h1>
            <p className="text-slate-600 mt-2">
              Ingresa tu email y te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                {success}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading || !email}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mt-5">
          <div className="flex items-start gap-3">
            <MailCheck className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Tip rápido</p>
              <p className="text-sm text-slate-600 mt-1">
                Si no ves el correo en unos minutos, revisa spam/promociones y confirma que escribiste bien tu email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



