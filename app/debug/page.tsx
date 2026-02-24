"use client";

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Variables de Entorno</h1>
      <div className="space-y-2 font-mono text-sm">
        <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ NO DEFINIDA"}</p>
        <p>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ DEFINIDA" : "❌ NO DEFINIDA"}</p>
      </div>
    </div>
  );
}
