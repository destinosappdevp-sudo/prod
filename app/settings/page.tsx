import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Bell } from "lucide-react";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/my-dashboard"
            className="p-2 hover:bg-slate-200 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-3xl font-bold">Configuración</h1>
        </div>

        {/* TODO: Agregar opciones de configuración */}
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell size={24} />
              Preferencias de Notificaciones
            </h2>
            <p className="text-slate-500">En desarrollo</p>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Cuenta</h2>
            <p className="text-slate-500">En desarrollo</p>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Privacidad</h2>
            <p className="text-slate-500">En desarrollo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
