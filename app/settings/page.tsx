"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Lock } from "lucide-react";
import { updateNotificationPreferences, getNotificationPreferences, getUserAuth } from "@/app/action";

type NotificationPreferencesType = {
  emailOnReservation: boolean;
  emailOnReview: boolean;
  emailOnMessage: boolean;
  emailOnPayment: boolean;
  smsNotifications: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    emailOnReservation: true,
    emailOnReview: true,
    emailOnMessage: true,
    emailOnPayment: true,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getUserAuth();
      
      if (!user) {
        redirect("/login");
      }
      
      setUserId(user.id);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleToggle = (key: keyof NotificationPreferencesType) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (userId) {
      await updateNotificationPreferences(userId, preferences);
    }

    setSaving(false);
    router.refresh();
  };

  if (loading) {
    return <div>Cargando...</div>;
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

        <form onSubmit={handleSave} className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Bell size={24} />
              Preferencias de Notificaciones
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email en reservaciones</p>
                  <p className="text-sm text-slate-600">
                    Recibe notificaciones cuando alguien reserve o cancele
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailOnReservation}
                  onChange={() => handleToggle("emailOnReservation")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <hr className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email en reseñas</p>
                  <p className="text-sm text-slate-600">
                    Notificaciones sobre nuevas reseñas y calificaciones
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailOnReview}
                  onChange={() => handleToggle("emailOnReview")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <hr className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email en mensajes</p>
                  <p className="text-sm text-slate-600">
                    Recibe notificaciones de nuevos mensajes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailOnMessage}
                  onChange={() => handleToggle("emailOnMessage")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <hr className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email en pagos</p>
                  <p className="text-sm text-slate-600">
                    Confirma recepción de pagos y cambios de estado
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailOnPayment}
                  onChange={() => handleToggle("emailOnPayment")}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <hr className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones SMS</p>
                  <p className="text-sm text-slate-600 text-yellow-600">
                    Próximamente disponible
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked={preferences.smsNotifications}
                  className="w-5 h-5 cursor-not-allowed opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Lock size={24} />
              Cuenta y Seguridad
            </h2>

            <div className="space-y-4">
              <Link
                href="/my-dashboard?tab=profile"
                className="block p-4 border border-slate-200 rounded-lg hover:border-orange-300 transition text-slate-700 hover:text-orange-600"
              >
                <p className="font-medium">Editar Perfil</p>
                <p className="text-sm text-slate-600">
                  Actualiza tu nombre, foto y información personal
                </p>
              </Link>

              <Link
                href="#"
                className="block p-4 border border-slate-200 rounded-lg hover:border-orange-300 transition text-slate-700 hover:text-orange-600"
              >
                <p className="font-medium">Cambiar Contraseña</p>
                <p className="text-sm text-slate-600">
                  Actualiza tu contraseña de acceso
                </p>
              </Link>

              <Link
                href="#"
                className="block p-4 border border-slate-200 rounded-lg hover:border-orange-300 transition text-slate-700 hover:text-orange-600"
              >
                <p className="font-medium">Privacidad</p>
                <p className="text-sm text-slate-600">
                  Controla quién puede ver tu perfil y datos
                </p>
              </Link>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
