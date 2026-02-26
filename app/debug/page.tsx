"use client";

import { signUpWithRole } from "../action";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DebugPage() {
  const [email, setEmail] = useState("colombeiaweb@gmail.com");
  const [password, setPassword] = useState("colombeiaweb@gmail.com");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegisterSuperadmin = async () => {
    setLoading(true);
    setMessage("Registrando SUPERADMIN...");

    const result = await signUpWithRole(email, password, "SUPERADMIN");

    if (result.error) {
      setMessage(`❌ Error: ${result.error}`);
    } else {
      setMessage(
        "✅ SUPERADMIN registrado correctamente. Puedes eliminar esta página cuando termines."
      );
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">🔧 Debug Panel</h1>

      {/* Variables de entorno */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-3">Variables de Entorno</h2>
        <div className="space-y-2 font-mono text-sm">
          <p>
            URL:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "✅ DEFINIDA"
              : "❌ NO DEFINIDA"}
          </p>
          <p>
            KEY:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "✅ DEFINIDA"
              : "❌ NO DEFINIDA"}
          </p>
        </div>
      </div>

      {/* Crear SUPERADMIN */}
      <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded">
        <h2 className="text-lg font-semibold mb-3">⚡ Crear SUPERADMIN</h2>
        <p className="text-sm text-gray-600 mb-4">
          Registra el usuario SUPERADMIN con los datos por defecto. Una vez
          completado, puedes eliminar esta página y el botón.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleRegisterSuperadmin}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? "Registrando..." : "Registrar SUPERADMIN"}
          </Button>

          {message && (
            <p
              className={`text-sm font-mono ${
                message.includes("❌") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
