"use client";
import { useState } from "react";

type ManualKey = "admin";

type ManualSectionData = {
  titulo: string;
  texto: React.ReactNode;
  img: string;
};

const manuales: {
  key: ManualKey;
  titulo: string;
  secciones: { id: string; titulo: string }[];
}[] = [
  {
    key: "admin",
    titulo: "Administrador",
    secciones: [
      { id: "usuarios", titulo: "Gestión de Usuarios" },
      { id: "paquetes", titulo: "Paquetes" },
      { id: "pagos", titulo: "Pagos y Reservas" },
      { id: "banners", titulo: "Publicidad (Banners)" },
    ],
  },
  {
    key: "banner",
    titulo: "Publicidad (Banner)",
    secciones: [
      { id: "crear", titulo: "Crear Banner" },
      { id: "activos", titulo: "Banners Activos" },
      { id: "inactivos", titulo: "Banners Inactivos" },
    ],
  },
];

const contenido: Record<ManualKey, Record<string, ManualSectionData>> = {
  admin: {
    usuarios: {
      titulo: "Gestión de Usuarios",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2">
            <li>Visualiza el listado completo de usuarios registrados.</li>
            <li>Edita datos personales, roles y estado de verificación.</li>
            <li>Elimina usuarios que incumplan normas o por solicitud.</li>
            <li>Filtra usuarios por rol (admin, host, guest, etc).</li>
            <li>Para editar, haz clic en el ícono de lápiz junto al usuario.</li>
          </ul>
          <div className="text-sm text-muted-foreground">Tip: Usa la barra de búsqueda para encontrar usuarios rápidamente.</div>
        </>
      ),
      img: "/screenshot/manual-admin-usuarios.png",
    },
    propiedades: {
      titulo: "Propiedades",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2 space-y-2 text-gray-800 leading-relaxed">
            <li>Agrega nuevas propiedades desde el botón <b>"Añadir Propiedad"</b>.</li>
            <li>Edita información, fotos, precios y disponibilidad.</li>
            <li>Elimina propiedades obsoletas o con problemas.</li>
            <li>Gestiona servicios y comodidades desde la pestaña correspondiente.</li>
            <li>Para editar, selecciona la propiedad y haz clic en <b>"Editar"</b>.</li>
          </ul>
          <div className="mt-3 text-sm text-gray-400">Recomendación: Mantén la información siempre actualizada para mejor experiencia de usuario.</div>
        </>
      ),
      img: "/admin/packages-list.svg",
    },
    pagos: {
      titulo: "Pagos y Reservas",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2">
            <li>Consulta pagos pendientes y confirmados en la sección de pagos.</li>
            <li>Confirma pagos manualmente si es necesario.</li>
            <li>Accede al historial de reservas por usuario o propiedad.</li>
            <li>Filtra por estado, fecha o usuario para encontrar información específica.</li>
          </ul>
          <div className="text-sm text-muted-foreground">Importante: Revisa pagos pendientes diariamente para evitar retrasos.</div>
        </>
      ),
      img: "/screenshot/mlogo.png",
    },
    banners: {
      titulo: "Publicidad (Banners)",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2">
            <li>Crea campañas publicitarias desde la pestaña <b>Publicidad</b>.</li>
            <li>Sube imágenes en formato <b>JPG o PNG</b>.</li>
            <li>Medidas recomendadas:<br/>
              <ul className="list-disc ml-8">
                <li><b>HERO1/HERO2:</b> 800x400 px (2:1)</li>
                <li><b>MEDIO1/MEDIO2 (Desktop):</b> 970x90 px</li>
                <li><b>MEDIO1/MEDIO2 (mobile):</b> 640x200 px</li>
                <li><b>POP:</b> 1200x600 px (2:1)</li>
              </ul>
            </li>
            <li>Define fechas de inicio y fin de la campaña.</li>
            <li>Activa o desactiva campañas según necesidad.</li>
            <li>Para editar o eliminar, usa los íconos correspondientes en la lista de banners.</li>
          </ul>
          <div className="text-sm text-muted-foreground">Las imágenes fuera de medida pueden verse recortadas o deformadas.</div>
        </>
      ),
      img: "/screenshot/logo.png",
    },
  },
  banner: {
    crear: {
      titulo: "Crear Banner",
      texto: (
        <>
          <h4 className="font-semibold mb-3">1. Crear Nuevo Banner</h4>
          <ol className="list-decimal ml-6 mb-4 space-y-6">
            <li>
              <div><b>1.1 Titulo:</b> escribe el nombre de la campana para identificar el banner.</div>
              <img src="/screenshot/1-1.webp" alt="Paso 1.1 Titulo" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.2 Tipo de Banner:</b> selecciona donde se mostrara (HERO1, HERO2, MEDIO1, MEDIO2 o POP).</div>
              <img src="/screenshot/1-2.webp" alt="Paso 1.2 Tipo de Banner" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.3 Fecha inicio / Fecha fin:</b> define desde cuando se publica y hasta cuando estara activo.</div>
              <img src="/screenshot/1-3.webp" alt="Paso 1.3 Fecha inicio y fin" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.4 URL destino:</b> coloca el enlace al que ira el usuario al hacer clic en el banner.</div>
              <img src="/screenshot/1-4.webp" alt="Paso 1.4 URL destino" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.5 Telefono cliente / Email cliente:</b> registra los datos de contacto del anunciante.</div>
              <img src="/screenshot/1-5.webp" alt="Paso 1.5 Telefono y email" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.6 Costo (USD):</b> indica el monto pagado o acordado para esta campana.</div>
              <img src="/screenshot/1-6.webp" alt="Paso 1.6 Costo en USD" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
            <li>
              <div><b>1.7 Imagen:</b> sube la imagen final del banner.</div>
              <img src="/screenshot/1-7.webp" alt="Paso 1.7 Imagen" className="mt-2 rounded border shadow-sm max-w-full h-auto" />
            </li>
          </ol>
          <div className="text-sm text-muted-foreground">
            Medidas recomendadas: HERO1/HERO2 800x400, MEDIO1/MEDIO2 Desktop 970x90, MEDIO1/MEDIO2 Mobile 640x200, POP 1200x600.
          </div>
        </>
      ),
      img: "/screenshot/logo",
    },
    activos: {
      titulo: "Banners Activos",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2">
            <li>Visualiza todos los banners actualmente publicados.</li>
            <li>Edita información o imagen haciendo clic en el ícono de lápiz.</li>
            <li>Elimina banners que ya no sean necesarios.</li>
            <li>Verifica fechas y estado de cada campaña.</li>
          </ul>
        </>
      ),
      img: "/screenshot/logo.png",
    },
    inactivos: {
      titulo: "Banners Inactivos",
      texto: (
        <>
          <ul className="list-disc ml-6 mb-2">
            <li>Consulta banners que aún no han iniciado o ya expiraron.</li>
            <li>Puedes reactivar campañas editando fechas.</li>
            <li>Elimina banners antiguos para mantener el panel ordenado.</li>
          </ul>
        </>
      ),
      img: "/screenshot/logo.png",
    },
  },
};

export default function ManualesPage() {
  const [manualActivo, setManualActivo] = useState<ManualKey>("admin");

  const secciones = manuales.find((m) => m.key === manualActivo)?.secciones ?? [];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Manuales de Uso</h1>
      <div className="flex gap-4 mb-8">
        {manuales.map((m) => (
          <button
            key={m.key}
            onClick={() => setManualActivo(m.key as ManualKey)}
            className={`px-4 py-2 rounded-lg font-semibold border transition-colors focus:outline-none ${manualActivo === m.key ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary hover:bg-primary/10"}`}
          >
            {m.titulo}
          </button>
        ))}
      </div>

      {/* Índice */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-foreground">Índice</h2>
        <ul className="list-disc ml-6 space-y-1">
          {secciones.map((sec) => (
            <li key={sec.id}>
              <a href={`#${sec.id}`} className="text-blue-600 hover:underline font-medium">
                {sec.titulo}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Contenido */}
      <div className="space-y-12">
        {secciones.map((sec) => {
          const data = contenido[manualActivo][sec.id];
          return (
            <section key={sec.id} id={sec.id} className="scroll-mt-24">
              <h3 className={`font-bold mb-2 mt-8 ${sec.id === 'propiedades' ? 'text-2xl text-orange-500' : 'text-lg text-primary'}`}>{data.titulo}</h3>
              <div className="mb-4 text-foreground/90">{data.texto}</div>
              <div className="w-full flex justify-center mb-2">
                <img
                  src={data.img}
                  alt={data.titulo}
                  className="rounded-lg border shadow-sm max-h-72 object-contain bg-muted"
                  style={{ minHeight: 180, maxWidth: 480 }}
                  onError={(e) => (e.currentTarget.src = "/screenshot/manual-default.png")}
                />
              </div>
              <a href="#" className="text-xs text-blue-500 hover:underline" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Volver al índice ↑</a>
            </section>
          );
        })}
      </div>

      <div className="mt-12 text-gray-500 text-sm text-center">
        Las imágenes serán reemplazadas por capturas reales.<br />
        Si tienes dudas, contacta soporte.
      </div>
    </div>
  );
}



