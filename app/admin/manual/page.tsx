"use client";

type Section = {
  id: string;
  titulo: string;
  texto: React.ReactNode;
  img: string;
  videoUrl?: string;
};

const secciones: Section[] = [
  {
    id: "usuarios",
    titulo: "Gestión de Usuarios",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li>Visualiza el listado completo de usuarios registrados (paginado, 10 por página).</li>
        <li>Busca por nombre, email o cédula. Filtra por rol (Todos / Usuarios / Admin).</li>
        <li><b>Crear usuario:</b> formulario con nombre, email, contraseña, cédula, teléfono y rol.</li>
        <li><b>Importar CSV:</b> carga masiva con separador automático. Columnas: Nombre, Correo, Cédula, Fecha de Nacimiento, Teléfono, Dirección, Viaja con niños, etc.</li>
        <li><b>Exportar</b> usuarios a CSV.</li>
        <li>Edita datos personales, rol y contraseña desde la página de detalle.</li>
        <li>Elimina usuarios (solo SUPERADMIN, requiere confirmación escribiendo el email).</li>
      </ul>
    ),
    img: "/screenshot/usuarios.webp",
  },
  {
    id: "paquetes",
    titulo: "Paquetes",
    texto: (
      <>
        <ul className="list-disc ml-6 mb-2 space-y-1">
          <li>Listado paginado con búsqueda por título, email o categoría.</li>
          <li>Cambia el estado del paquete inline: Borrador / Pendiente / Activa / Inactiva.</li>
          <li><b>Nuevo Paquete:</b> formulario con título, categorías, descripción, cupos VIP/Estándar, ubicación, precios, fecha de salida, contacto, servicios e imagen.</li>
          <li>Pestaña <b>Reservas Activas:</b> reservas próximas confirmadas con opción de reenviar email.</li>
          <li>Los cupos VIP y Estándar deben ser números pares.</li>
        </ul>
      </>
    ),
    img: "/screenshot/paquetes.webp",
  },
  {
    id: "reserva-manual",
    titulo: "Cómo hacer una reserva manual",
    videoUrl: "https://drive.google.com/file/d/1MA91qCGU6Fo5ogXk0imVz52XQyCpl0OR/view?usp=sharing",
    texto: (
      <ol className="list-decimal ml-6 space-y-2">
        <li>Ve al detalle del paquete (haz clic en <b>Ver/Editar</b>).</li>
        <li>Selecciona la pestaña <b>Reservar</b>.</li>
        <li><b>Buscar usuario por cédula:</b> ingresa la cédula (ej. V-12345678) y haz clic en "Buscar". Se mostrarán los datos del usuario.</li>
        <li><b>Tipo de operación:</b> por defecto es <b>Pagar de contado</b> (pago completo). Si el usuario va a abonar en partes, marca el check <b>"Ahorrar"</b>.</li>
        <li><b>Tipo de cupo:</b> selecciona Estándar o Premium VIP.</li>
        <li><b>Cupos:</b> indica cuántas personas viajan. El monto estimado se calcula automáticamente (precio × cupos).</li>
        <li>Si es <b>modo ahorro:</b> completa el monto del abono inicial en USD (debe ser menor al total) y la fecha de inicio/abono.</li>
        <li><b>Seleccionar asientos:</b> el mapa se habilita una vez elegido usuario y (si aplica) monto válido. Haz clic en los asientos disponibles. Deben coincidir con los cupos indicados.</li>
        <li><b>Datos de pago:</b> completa teléfono Pago Móvil, banco emisor, referencia y cédula del pagador.</li>
        <li><b>Observaciones:</b> notas internas (opcional).</li>
        <li>Haz clic en <b>"Registrar Reserva Manual"</b> (pago completo) o <b>"Registrar ahorro específico"</b> (abono inicial). El sistema crea la reserva y asigna los asientos automáticamente.</li>
      </ol>
    ),
    img: "/screenshot/manual-default.png",
  },
  {
    id: "pagos",
    titulo: "Pagos y Reservas",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li>Panel unificado de pagos y abonos de alcancía en <b>Finanzas</b>.</li>
        <li>Tarjetas de resumen: ingresos confirmados, alcancías activas, monto en alcancías, pagos confirmados.</li>
        <li>Tabla de movimientos combinados con fecha, tipo (Abono/Pago), usuario, paquete, monto, método de pago, estado.</li>
        <li><b>Confirmar pago:</b> botón verde para pagos pendientes.</li>
        <li><b>Rechazar pago:</b> botón rojo, requiere motivo.</li>
        <li>También puedes ver todas las <b>Reservas Activas</b> desde la pestaña correspondiente en Paquetes.</li>
      </ul>
    ),
    img: "/screenshot/ventas.png",
  },
  {
    id: "banners",
    titulo: "Publicidad (Banners)",
    texto: (
      <>
        <ul className="list-disc ml-6 mb-2 space-y-1">
          <li>Disponible solo para SUPERADMIN desde el menú <b>Publicidad</b>.</li>
          <li>Sube imágenes en formato JPG o PNG.</li>
          <li>Medidas recomendadas:
            <ul className="list-disc ml-8 mt-1">
              <li><b>HERO1/HERO2:</b> 800x400 px (2:1)</li>
              <li><b>MEDIO1/MEDIO2 (Desktop):</b> 970x90 px</li>
              <li><b>MEDIO1/MEDIO2 (Mobile):</b> 640x200 px</li>
              <li><b>POP:</b> 1200x600 px (2:1)</li>
            </ul>
          </li>
          <li>Define fechas de inicio y fin de la campaña.</li>
          <li>Activa o desactiva campañas editando fechas.</li>
        </ul>
        <h4 className="font-semibold mt-4 mb-2">Crear Banner</h4>
        <ol className="list-decimal ml-6 space-y-1">
          <li><b>Título:</b> nombre de la campaña para identificar el banner.</li>
          <li><b>Tipo de Banner:</b> HERO1, HERO2, MEDIO1, MEDIO2 o POP.</li>
          <li><b>Fecha inicio / Fecha fin:</b> define el período de publicación.</li>
          <li><b>URL destino:</b> enlace al que irá el usuario al hacer clic.</li>
          <li><b>Teléfono / Email:</b> datos de contacto del anunciante (opcional).</li>
          <li><b>Costo (USD):</b> monto acordado para la campaña (opcional).</li>
          <li><b>Imagen:</b> sube nueva o selecciona del archivo. Recomendado 400x200px (2:1).</li>
        </ol>
        <h4 className="font-semibold mt-4 mb-2">Banners Activos</h4>
        <ul className="list-disc ml-6 mb-2 space-y-1">
          <li>Visualiza todos los banners actualmente publicados (dentro del rango de fechas).</li>
          <li>Edita información o imagen con el ícono de lápiz.</li>
          <li>Elimina banners que ya no sean necesarios.</li>
        </ul>
        <h4 className="font-semibold mt-4 mb-2">Banners Inactivos</h4>
        <ul className="list-disc ml-6 mb-2 space-y-1">
          <li>Consulta banners que aún no han iniciado o ya expiraron.</li>
          <li>Reactiva campañas editando las fechas.</li>
          <li>Elimina banners antiguos para mantener el panel ordenado.</li>
        </ul>
      </>
    ),
    img: "/screenshot/manual-default.png",
  },
];

export default function ManualPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Manual de Administración</h1>

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

      <div className="space-y-12">
        {secciones.map((sec) => (
          <section key={sec.id} id={sec.id} className="scroll-mt-24">
            <h3 className="text-xl font-bold inline-block mb-2 text-primary">{sec.titulo}</h3>
            {sec.videoUrl && (
              <a
                href={sec.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 text-sm text-blue-600 hover:underline"
              >
                (Ver Video)
              </a>
            )}
            <div className="mb-4 text-foreground/90">{sec.texto}</div>
            <div className="w-full flex justify-center mb-2">
              <img
                src={sec.img}
                alt={sec.titulo}
                className="rounded-lg border shadow-sm max-h-72 object-contain bg-muted"
                style={{ minHeight: 180, maxWidth: 480 }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <a
              href="#"
              className="text-xs text-blue-500 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Volver al índice ↑
            </a>
          </section>
        ))}
      </div>

      <div className="mt-12 text-gray-500 text-sm text-center">
        Las imágenes serán reemplazadas por capturas reales.<br />
        Si tienes dudas, contacta soporte.
      </div>
    </div>
  );
}
