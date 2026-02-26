import { Card } from "@/components/ui/card";
import { Bell, Mail, Shield, Database, Globe, Palette } from "lucide-react";

export default async function SettingsPage() {
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Modo de Mantenimiento</p>
                <p className="text-sm text-gray-600">Deshabilita el acceso público temporalmente</p>
              </div>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
                Desactivado
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Registros Públicos</p>
                <p className="text-sm text-gray-600">Permite que nuevos usuarios se registren</p>
              </div>
              <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" disabled>
                Activo
              </button>
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

        {/* Email Configuration */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold">Configuración de Email</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP
              </label>
              <input
                type="text"
                placeholder="smtp.ejemplo.com"
                className="w-full p-2 border rounded-lg bg-gray-50"
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  placeholder="usuario@ejemplo.com"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puerto
                </label>
                <input
                  type="text"
                  placeholder="587"
                  className="w-full p-2 border rounded-lg bg-gray-50"
                  disabled
                />
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
              Guardar Configuración
            </button>
          </div>
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
