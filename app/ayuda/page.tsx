const faqs = [
  {
    category: "Reservas",
    items: [
      {
        q: "¿Cómo hago una reserva?",
        a: "Busca el alojamiento que deseas, elige las fechas y la cantidad de huéspedes, luego presiona \"Hacer una reserva\" y completa el pago.",
      },
      {
        q: "¿Puedo cancelar una reserva?",
        a: "Depende de la política del anfitrión. Puedes revisar los detalles de cancelación en la página del alojamiento antes de reservar.",
      },
      {
        q: "¿Cómo sé si mi reserva fue confirmada?",
        a: "Recibirás una notificación por correo electrónico y el estado de la reserva cambiará a \"Confirmada\" en tu escritorio.",
      },
    ],
  },
  {
    category: "Pagos",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos Pago Móvil, Zelle, Zilli, transferencia bancaria y tarjeta internacional.",
      },
      {
        q: "¿Cuándo se procesa mi pago?",
        a: "El pago se procesa al completar la reserva. El anfitrión recibirá el monto una vez confirmada tu estadía.",
      },
      {
        q: "¿Hay algún cargo de servicio?",
        a: "Sí, Zerkka aplica una pequeña tarifa de servicio para cubrir los costos de la plataforma. El monto exacto se muestra en el resumen del pago antes de confirmar.",
      },
    ],
  },
  {
    category: "Anfitriones",
    items: [
      {
        q: "¿Cómo me convierto en anfitrión?",
        a: "Regístrate, cambia tu rol a Anfitrión desde tu perfil y publica tu primer alojamiento completando los pasos de creación.",
      },
      {
        q: "¿Cuándo recibo el pago por mis alojamientos?",
        a: "El pago se transfiere al anfitrión después de que el huésped confirme su llegada y el estado de la reserva esté completada.",
      },
      {
        q: "¿Qué pasa si el huésped no se presenta?",
        a: "Contacta a nuestro equipo de soporte a través de la sección de mensajes o por correo electrónico para resolver la situación.",
      },
    ],
  },
  {
    category: "Cuenta",
    items: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ve a Configuración en tu escritorio y selecciona la opción de cambiar contraseña, o usa la opción \"Olvidé mi contraseña\" en el inicio de sesión.",
      },
      {
        q: "¿Cómo elimino mi cuenta?",
        a: "Puedes solicitar la eliminación de tu cuenta desde Configuración > Cuenta > Eliminar cuenta. El proceso es irreversible.",
      },
    ],
  },
];

export default function AyudaPage() {
  return (
    <main className="container mx-auto px-5 lg:px-10 py-16 max-w-3xl">
      {/* Encabezado */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Centro de ayuda</h1>
        <p className="text-gray-500 text-lg">
          Encuentra respuestas a las preguntas más frecuentes sobre Zerkka.
        </p>
      </div>

      {/* Contacto rápido */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg mb-1">¿No encuentras lo que buscas?</h2>
          <p className="text-gray-500 text-sm">Escríbenos y te respondemos a la brevedad posible.</p>
        </div>
        <a
          href="/contacto"
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          Contactar soporte
        </a>
      </div>

      {/* FAQs por categoría */}
      <div className="space-y-10">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">
              {section.category}
            </h2>
            <div className="divide-y divide-gray-100">
              {section.items.map((item) => (
                <details
                  key={item.q}
                  className="group py-4 cursor-pointer list-none"
                >
                  <summary className="flex items-center justify-between gap-4 text-gray-800 font-medium select-none list-none hover:text-orange-500 transition-colors">
                    {item.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 text-lg leading-none">
                      ›
                    </span>
                  </summary>
                  <p className="mt-3 text-gray-500 text-sm leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
