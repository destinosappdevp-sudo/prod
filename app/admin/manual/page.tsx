import Link from "next/link";

export default function AdminManualPage() {
  return (
    <div className="prose max-w-none">
      <div className="flex items-center gap-4 mb-6">
        <img src="/logo.png" alt="Logo provisional" className="h-12 w-12 object-contain" />
        <div>
          <h1 className="text-2xl font-bold">Manual de Admin</h1>
          <p className="text-sm text-gray-600">Guía rápida de uso para el panel de administración.</p>
        </div>
      </div>

      <h2>Menú</h2>
      <ul>
        <li>Dashboard</li>
        <li>Publicidad</li>
        <li>Usuarios</li>
        <li>Paquetes</li>
        <li>Categorías</li>
        <li>Servicios</li>
        <li>Finanzas</li>
        <li>Alcancía</li>
      </ul>

      <h2>Dashboard</h2>
      <p>Vista principal con métricas, actividad reciente y accesos rápidos.</p>

      <h2>Publicidad</h2>
      <p>Gestiona banners y campañas. Crear, editar, activar o desactivar anuncios.</p>

      <h2>Usuarios</h2>
      <p>Listado y gestión de usuarios: buscar, ver perfil, cambiar rol o suspender.</p>

      <h2>Paquetes</h2>
      <p>Gestiona paquetes/propiedades: ver, editar, aprobar y publicar.</p>

      <h2>Categorías</h2>
      <p>Crear y organizar categorías que clasifican los paquetes.</p>

      <h2>Servicios</h2>
      <p>Configurar amenities y servicios asociados a paquetes.</p>

      <h2>Finanzas</h2>
      <p>Panel financiero: transacciones, pagos y reportes.</p>

      <h2>Alcancía</h2>
      <p>Crear y gestionar alcancías, ver balances y agregar saldo.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <img src="/admin/dashboard.svg" alt="Dashboard ejemplo" />
        <img src="/admin/users-list.svg" alt="Usuarios ejemplo" />
        <img src="/admin/packages-list.svg" alt="Paquetes ejemplo" />
        <img src="/admin/ads-list.svg" alt="Publicidad ejemplo" />
        <img src="/admin/categories.svg" alt="Categorías ejemplo" />
        <img src="/admin/services.svg" alt="Servicios ejemplo" />
        <img src="/admin/finance.svg" alt="Finanzas ejemplo" />
        <img src="/admin/savings.svg" alt="Alcancía ejemplo" />
      </div>
      <p className="mt-4 text-sm text-gray-500">Capturas provisionales en <code>/public/admin/</code>. Reemplazar por imágenes reales cuando estén disponibles.</p>
    </div>
  );
}
