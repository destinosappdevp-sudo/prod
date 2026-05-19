"use client";
import { Card } from "@/components/ui/card";
import { Bell, Shield, Database, Globe, Palette, Wrench, Landmark } from "lucide-react";
import { useEffect, useState } from "react";
import { formatBcvRateInput } from "@/app/lib/bcv-rate-format";

type RateHistoryItem = {
  fecha: string | null;
  tasa: string;
};

function formatRateForInput(value: unknown): string {
  return formatBcvRateInput(value);
}

function formatHistoryDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-VE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default function SettingsPage() {
  // Comisión
  const [commission, setCommission] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Modo mantenimiento
  const [maintenance, setMaintenance] = useState<boolean>(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState<boolean>(true);
  const [maintenanceSaving, setMaintenanceSaving] = useState<boolean>(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string>("");

  // Tasa BCV
  const [bcvRate, setBcvRate] = useState<string>("");
  const [bcvRateDate, setBcvRateDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [proximaTasa, setProximaTasa] = useState<string>("");
  const [proximaTasaDate, setProximaTasaDate] = useState<string>("");
  const [tasasAnteriores, setTasasAnteriores] = useState<RateHistoryItem[]>([]);
  const [bcvLoading, setBcvLoading] = useState<boolean>(true);
  const [bcvSaving, setBcvSaving] = useState<boolean>(false);
  const [bcvSuccess, setBcvSuccess] = useState<boolean>(false);
  const [bcvError, setBcvError] = useState<string>("");

  // Reset Base de Datos
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);
  const [resetMsg, setResetMsg] = useState<string>("");

  // Sincronizar Usuarios
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [syncMsg, setSyncMsg] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/settings/commission").then(async (res) => {
      try {
        const data = await res.json();
        setCommission(data.commissionPercent ?? 10);
      } catch {
        setCommission(10);
      }
      setLoading(false);
    });

    fetch("/api/admin/settings/maintenance").then(async (res) => {
      try {
        const data = await res.json();
        setMaintenance(data.maintenanceMode ?? false);
      } catch {
        setMaintenance(false);
      }
      setMaintenanceLoading(false);
    });

    fetch("/api/admin/settings/bcv-rate").then(async (res) => {
      try {
        const data = await res.json();
        setBcvRate(formatRateForInput(data.bcvRate));
        if (data.bcvRateDate) {
          setBcvRateDate(String(data.bcvRateDate).slice(0, 10));
        }

        const nextRate = data.proximaTasa ?? data.bcvRateNextDay;
        const nextRateDate = data.proximaTasaDate ?? data.bcvRateNextDayDate;
        setProximaTasa(formatRateForInput(nextRate));
        if (nextRateDate) {
          setProximaTasaDate(String(nextRateDate).slice(0, 10));
        }

        const history = Array.isArray(data.tasasAnteriores)
          ? data.tasasAnteriores
          : [];
        setTasasAnteriores(
          history.map((item: any) => ({
            fecha: typeof item?.fecha === "string" ? item.fecha : null,
            tasa: formatRateForInput(item?.tasa),
          }))
        );
      } catch {
        setBcvRate("");
        setProximaTasa("");
        setTasasAnteriores([]);
      }
      setBcvLoading(false);
    });
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/settings/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionPercent: commission }),
      });
      const data = await res.json();
      if (res.ok) setSuccess(true);
      else setError(data.error || "Error al guardar");
    } catch {
      setError("Error de red");
    }
    setSaving(false);
  };

  const toggleMaintenance = async () => {
    setMaintenanceSaving(true);
    setMaintenanceMsg("");
    const next = !maintenance;
    try {
      const res = await fetch("/api/admin/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenance(data.maintenanceMode);
        setMaintenanceMsg(data.maintenanceMode ? "Modo mantenimiento activado" : "Modo mantenimiento desactivado");
      } else {
        setMaintenanceMsg(data.error || "Error al guardar");
      }
    } catch {
      setMaintenanceMsg("Error de red");
    }
    setMaintenanceSaving(false);
    setTimeout(() => setMaintenanceMsg(""), 3000);
  };

  const handleBcvSubmit = async (e: any) => {
    e.preventDefault();
    setBcvSaving(true);
    setBcvError("");
    setBcvSuccess(false);

    try {
      const res = await fetch("/api/admin/settings/bcv-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bcvRate,
          bcvRateDate,
          proximaTasa,
          proximaTasaDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBcvSuccess(true);
        setBcvRate(formatRateForInput(data.bcvRate));
        if (data.bcvRateDate) {
          setBcvRateDate(String(data.bcvRateDate).slice(0, 10));
        }

        const nextRate = data.proximaTasa ?? data.bcvRateNextDay;
        const nextRateDate = data.proximaTasaDate ?? data.bcvRateNextDayDate;
        setProximaTasa(formatRateForInput(nextRate));
        setProximaTasaDate(nextRateDate ? String(nextRateDate).slice(0, 10) : "");

        const history = Array.isArray(data.tasasAnteriores)
          ? data.tasasAnteriores
          : [];
        setTasasAnteriores(
          history.map((item: any) => ({
            fecha: typeof item?.fecha === "string" ? item.fecha : null,
            tasa: formatRateForInput(item?.tasa),
          }))
        );
      } else {
        setBcvError(data.error || "Error al guardar");
      }
    } catch {
      setBcvError("Error de red");
    }

    setBcvSaving(false);
  };

  const handleResetDatabase = async () => {
    if (!resetConfirm) {
      setResetMsg("Por favor, confirma que deseas reiniciar la base de datos.");
      setTimeout(() => setResetMsg(""), 3000);
      return;
    }

    setResetLoading(true);
    setResetMsg("");

    try {
      const res = await fetch("/api/admin/settings/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setResetMsg("? Base de datos reiniciada correctamente. Solo el superadmin permanece.");
        setResetConfirm(false);
      } else {
        setResetMsg(`Error: ${data.error || "No se pudo reiniciar la base de datos"}`);
      }
    } catch (err) {
      setResetMsg("Error de red al reiniciar la base de datos");
    }

    setResetLoading(false);
    setTimeout(() => setResetMsg(""), 5000);
  };

  const handleSyncUsers = async () => {
    setSyncLoading(true);
    setSyncMsg("");

    try {
      const res = await fetch("/api/admin/settings/sync-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`? ${data.message} (Sincronizados: ${data.synced}, Ya existían: ${data.skipped})`);
      } else {
        setSyncMsg(`Error: ${data.error || "No se pudo sincronizar usuarios"}`);
      }
    } catch (err) {
      setSyncMsg("Error de red al sincronizar usuarios");
    }

    setSyncLoading(false);
    setTimeout(() => setSyncMsg(""), 5000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Gestiona las configuraciones de la plataforma</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Configuración General</h3>
          </div>
          <div className="space-y-4">
            {/* Modo Mantenimiento */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${maintenance ? "bg-red-100" : "bg-gray-100"}`}>
                  <Wrench className={maintenance ? "text-red-600" : "text-gray-500"} size={18} />
                </div>
                <div>
                  <p className="font-medium">Modo de Mantenimiento</p>
                  <p className="text-sm text-gray-600">
                    {maintenance
                      ? "El sitio está en mantenimiento  solo admins pueden acceder"
                      : "El sitio está activo y accesible al público"}
                  </p>
                  {maintenanceMsg && (
                    <p className={`text-xs mt-1 ${maintenance ? "text-red-600" : "text-green-600"}`}>
                      {maintenanceMsg}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={toggleMaintenance}
                disabled={maintenanceLoading || maintenanceSaving}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                  maintenance ? "bg-red-500" : "bg-gray-300"
                } ${maintenanceSaving ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    maintenance ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Registros Públicos */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Registros Públicos</p>
                <p className="text-sm text-gray-600">Permite que nuevos usuarios se registren</p>
              </div>
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" disabled>
                Activo
              </button>
            </div>

            {/* Comisión Destinos Venezuela */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Comisión Destinos Venezuela</p>
                <p className="text-sm text-gray-600">Porcentaje aplicado a cada pago</p>
              </div>
              <form className="flex items-center gap-2" onSubmit={handleSubmit}>
                <input
                  type="number"
                  name="commission"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commission}
                  onChange={e => setCommission(Number(e.target.value))}
                  className="w-20 p-2 border rounded-lg bg-white text-right"
                  style={{ width: "70px" }}
                  disabled={loading || saving}
                />
                <span className="text-gray-700 font-medium">%</span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading || saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                {success && <span className="text-green-600 ml-2 text-sm">¡Guardado!</span>}
                {error && <span className="text-red-600 ml-2 text-sm">{error}</span>}
              </form>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="text-purple-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Notificaciones</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Notificaciones de Email</p>
                <p className="text-sm text-gray-600">Enviar emails automáticos a usuarios</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Configurar
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Notificaciones Push</p>
                <p className="text-sm text-gray-600">Notificaciones en tiempo real</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Próximamente
              </button>
            </div>
          </div>
        </Card>

        {/* Tasa BCV del día */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Landmark className="text-emerald-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Tasa BCV del día y próxima tasa</h3>
          </div>
          <form className="space-y-4" onSubmit={handleBcvSubmit}>
            <p className="text-sm text-gray-600">
              Ingresa tasas en formato decimal con coma (ejemplo: 448,36860000). La próxima tasa se guarda con la fecha que selecciones.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasa BCV del día (Bs/USD)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="448,36860000"
                  value={bcvRate}
                  onChange={(e) => setBcvRate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  disabled={bcvLoading || bcvSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de referencia del día</label>
                <input
                  type="date"
                  value={bcvRateDate}
                  onChange={(e) => setBcvRateDate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  disabled={bcvLoading || bcvSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Próxima tasa (Bs/USD)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="448,36860000"
                  value={proximaTasa}
                  onChange={(e) => setProximaTasa(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  disabled={bcvLoading || bcvSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de la próxima tasa</label>
                <input
                  type="date"
                  value={proximaTasaDate}
                  onChange={(e) => setProximaTasaDate(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                  disabled={bcvLoading || bcvSaving}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
                disabled={bcvLoading || bcvSaving}
                type="submit"
              >
                {bcvSaving ? "Guardando..." : "Guardar tasa BCV"}
              </button>

              {bcvSuccess && <span className="text-green-600 text-sm">¡Guardado!</span>}
              {bcvError && <span className="text-red-600 text-sm">{bcvError}</span>}
            </div>

            <p className="text-xs text-gray-500">
              Fechas seleccionadas: día {bcvRateDate || "Sin fecha"} y próxima tasa {proximaTasaDate || "Sin fecha"}
            </p>

            <div className="rounded-lg border bg-gray-50 p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Tasas anteriores</h4>
              {tasasAnteriores.length === 0 ? (
                <p className="text-xs text-gray-600">Aún no hay historial registrado.</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {tasasAnteriores.map((item, index) => (
                    <div
                      key={`${item.fecha ?? "sin-fecha"}-${index}`}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-2 border"
                    >
                      <span className="text-sm text-gray-700">{formatHistoryDate(item.fecha)}</span>
                      <span className="text-sm font-medium text-gray-900">{item.tasa || "0,00000000"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Card>

        {/* Security */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="text-red-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Seguridad</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Autenticación de Dos Factores</p>
                <p className="text-sm text-gray-600">Requerir 2FA para administradores</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Próximamente
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Logs de Seguridad</p>
                <p className="text-sm text-gray-600">Ver historial de accesos y cambios</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Ver Logs
              </button>
            </div>
          </div>
        </Card>

        {/* Database */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Database className="text-orange-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Base de Datos</h3>
          </div>
          <div className="space-y-4">
            {/* Sincronizar Usuarios */}
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-700">?? Sincronizar Usuarios</p>
                  <p className="text-sm text-gray-600">Trae todos los usuarios de Supabase auth.users a la base de datos</p>
                  {syncMsg && (
                    <p className={`text-xs mt-2 ${syncMsg.includes("?") ? "text-green-600" : "text-red-600"}`}>
                      {syncMsg}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSyncUsers}
                  disabled={syncLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {syncLoading ? "Sincronizando..." : "Sincronizar Usuarios"}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Backup Automático</p>
                <p className="text-sm text-gray-600">Crear respaldos periódicos de los datos</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Próximamente
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Optimizar Base de Datos</p>
                <p className="text-sm text-gray-600">Limpiar y optimizar tablas</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Optimizar
              </button>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-700">?? Reiniciar Base de Datos</p>
                  <p className="text-sm text-gray-600">Elimina TODOS los datos excepto el superadmin actual. Esta acción no se puede deshacer.</p>
                  {resetMsg && (
                    <p className={`text-xs mt-2 ${resetMsg.includes("?") ? "text-green-600" : "text-red-600"}`}>
                      {resetMsg}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {resetConfirm && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={resetConfirm}
                        onChange={() => setResetConfirm(!resetConfirm)}
                        className="w-4 h-4"
                      />
                      Confirmar eliminación
                    </label>
                  )}
                  <button
                    onClick={() => {
                      if (!resetConfirm) {
                        setResetConfirm(true);
                      } else {
                        handleResetDatabase();
                      }
                    }}
                    disabled={resetLoading}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      resetConfirm
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    } disabled:opacity-60`}
                  >
                    {resetLoading
                      ? "Reiniciando..."
                      : resetConfirm
                      ? "Confirmar Reinicio"
                      : "Reiniciar Base de Datos"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Palette className="text-pink-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Apariencia</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Logo de la Plataforma</p>
                <p className="text-sm text-gray-600">Personaliza el logo del sitio</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Subir Logo
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Colores de Marca</p>
                <p className="text-sm text-gray-600">Define la paleta de colores</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Personalizar
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}



