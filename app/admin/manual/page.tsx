"use client";
import { useState } from "react";

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
    id: "crear-usuarios",
    titulo: "Crear Usuarios",
    texto: (
      <ol className="list-decimal ml-6 space-y-2">
        <li>Desde el menú lateral, ve a <b>Usuarios</b>.</li>
        <li>Haz clic en el botón <b>"Crear usuario"</b>.</li>
        <li>Completa el formulario con los datos del usuario: <b>nombre, email, contraseña, cédula y teléfono</b>.</li>
        <li>Selecciona el <b>rol</b> del usuario: <b>Usuario</b> (cliente regular) o <b>Admin</b> (acceso al panel administrativo).</li>
        <li>Haz clic en <b>"Guardar"</b> para registrar el usuario.</li>
        <li>El usuario quedará registrado y podrá acceder a la plataforma con sus credenciales.</li>
        <li>También puedes <b>importar usuarios</b> desde un archivo CSV con los campos: Nombre, Correo, Cédula, Fecha de Nacimiento, Teléfono, Dirección, Viaja con niños, etc.</li>
      </ol>
    ),
    img: "/screenshot/crearusuarios.webp",
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
    id: "categorias",
    titulo: "Categorías",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li><b>Ruta:</b> <code>/admin/categories</code></li>
        <li>Gestión de tipos de paquete (categorías). Cada categoría tiene un <b>nombre</b> y un <b>ícono</b>.</li>
        <li><b>Crear categoría:</b> formulario con nombre e ícono.</li>
        <li><b>Ver/Editar:</b> modifica el nombre y el ícono de una categoría existente.</li>
        <li><b>Eliminar:</b> con confirmación para evitar borrados accidentales.</li>
      </ul>
    ),
    img: "/screenshot/categorias.webp",
  },
  {
    id: "servicios",
    titulo: "Servicios (Amenities)",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li><b>Ruta:</b> <code>/admin/amenities</code></li>
        <li><b>Grupos de servicios:</b> crea grupos con nombre y orden numérico. Puedes activar/desactivar grupos con un toggle.</li>
        <li><b>Servicios individuales:</b> cada servicio tiene nombre, icon key, icon URL y grupo asociado.</li>
        <li>Los servicios se muestran agrupados por categoría en el formulario de edición de paquetes.</li>
      </ul>
    ),
    img: "/screenshot/servicios.webp",
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
    img: "/screenshot/reservamanual.webp",
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
    id: "finanzas",
    titulo: "Finanzas",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li><b>Ruta:</b> <code>/admin/payments</code></li>
        <li>Cuatro tarjetas de resumen: <b>ingresos confirmados</b> (USD+Bs), <b>alcancías activas</b>, <b>monto en alcancías</b> (USD+Bs), <b>pagos confirmados</b>.</li>
        <li><b>Movimientos combinados:</b> tabla unificada de pagos y abonos de alcancía con fecha, tipo (Abono/Pago), usuario, paquete, total USD+Bs, método de pago, referencia, comprobante y estado.</li>
        <li><b>Confirmar pago:</b> botón verde para pagos pendientes.</li>
        <li><b>Rechazar pago:</b> botón rojo, requiere motivo.</li>
        <li>Alerta amarilla si hay pagos pendientes de confirmación.</li>
      </ul>
    ),
    img: "/screenshot/finanzas.webp",
  },
  {
    id: "alcancia",
    titulo: "Alcancía (Savings)",
    videoUrl: "https://drive.google.com/file/d/1d--VOwS5pZOmCOrk5rvvtpUR5IgHvHgI/view?usp=sharing",
    texto: (
      <ul className="list-disc ml-6 mb-2 space-y-1">
        <li><b>Ruta:</b> <code>/admin/savings</code></li>
        <li><b>Resumen:</b> tres tarjetas: pendientes de revisión (cantidad + USD), aprobado total (USD), total de depósitos.</li>
        <li><b>Depósitos:</b> tabla con fecha, usuario, referencia, comprobante, tasa BCV, monto Bs, monto USD, estado, y acciones (Aprobar/Rechazar).</li>
        <li><b>Abonar a Alcancía:</b> modal con búsqueda de usuario por cédula/nombre/email, selector de wallet (general o por paquete) con saldo actual y meta restante, monto USD con cálculo automático de Bs, y fecha del depósito.</li>
      </ul>
    ),
    img: "/screenshot/ahorros.webp",
  },
  {
    id: "cambiar-tasa-bcv",
    titulo: "Cambiar Tasa BCV",
    texto: (
      <ol className="list-decimal ml-6 space-y-2">
        <li>Ve al menú <b>Configuración</b> en el panel lateral.</li>
        <li>Localiza la sección <b>"Tasa BCV"</b>.</li>
        <li>Verás la <b>tasa actual</b> vigente en la plataforma (ej. 60,00 Bs/USD).</li>
        <li>En el campo <b>"Nueva tasa"</b> o <b>"Próxima tasa"</b>, ingresa el valor en bolívares según el BCV del día.</li>
        <li>Selecciona la <b>fecha de vigencia</b> para la nueva tasa (puede ser la fecha actual o una futura programada).</li>
        <li>Haz clic en <b>"Guardar"</b> o <b>"Actualizar tasa"</b>.</li>
        <li>La nueva tasa se aplicará automáticamente a todos los cálculos de precios en bolívares (Bs) de la plataforma.</li>
        <li>Puedes consultar el <b>historial de tasas anteriores</b> en la misma sección.</li>
        <li><b>Nota:</b> solo los usuarios con rol <b>SUPERADMIN</b> pueden modificar la tasa BCV.</li>
      </ol>
    ),
    img: "/screenshot/tasabcv.webp",
  },
];

export default function ManualPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Manual de Administración</h1>

      <div id="indice" className="mb-8">
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
              <button
                type="button"
                onClick={() => setLightbox(sec.img)}
                className="cursor-pointer"
              >
                <img
                  src={sec.img}
                  alt={sec.titulo}
                  className="rounded-lg border shadow-sm max-h-72 object-contain bg-muted"
                  style={{ minHeight: 180, maxWidth: 480 }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </button>
            </div>
            <a
              href="#"
              className="text-xs text-blue-500 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("indice")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Volver al índice ↑
            </a>
          </section>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300 z-10"
          >
            ✕
          </button>
          <img
            src={lightbox}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="mt-12 text-gray-500 text-sm text-center">
        Las imágenes serán reemplazadas por capturas reales.<br />
        Si tienes dudas, contacta soporte.
      </div>
    </div>
  );
}
