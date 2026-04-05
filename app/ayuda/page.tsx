const faqs = [
  {
    category: "Reservas de Paquetes",
    items: [
      {
        q: "¿Cómo reservo un paquete turístico?",
        a: "Explora los full days disponibles, selecciona el que te interesa, elige tu plan (Básico o Premium) y presiona \"Reservar Cupo\". Completa el formulario de pago y listo.",
      },
      {
        q: "¿Puedo cancelar mi reserva?",
        a: "Depende de la política del organizador del paquete. Puedes revisar los términos de cancelación en la página del paquete antes de reservar.",
      },
      {
        q: "¿Cómo sé si mi cupo fue confirmado?",
        a: "Recibirás una notificación por correo electrónico y el estado de tu reserva cambiará a \"Confirmada\" en tu panel de usuario.",
      },
      {
        q: "¿Con cuánta anticipación debo reservar?",
        a: "Recomendamos reservar con al menos 48 horas de anticipación para garantizar tu cupo. Algunos paquetes requieren mayor anticipación según el destino.",
      },
    ],
  },
  {
    category: "Pagos",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos Pago Móvil, Zelle, transferencia bancaria y tarjeta internacional.",
      },
      {
        q: "¿Cuándo se procesa mi pago?",
        a: "El pago se procesa al confirmar tu cupo. El organizador del paquete recibirá el monto una vez completado el servicio.",
      },
      {
        q: "¿Hay algún cargo de servicio?",
        a: "Sí, Destinos Venezuela aplica una pequeña tarifa de servicio para cubrir los costos de la plataforma. El monto exacto se muestra en el resumen del pago antes de confirmar.",
      },
      {
        q: "¿Los precios son en dólares o bolívares?",
        a: "Los precios se publican en USD. En la plataforma también verás el equivalente en Bs. calculado con la tasa BCV del día.",
      },
    ],
  },
  {
    category: "Durante el Paquete",
    items: [
      {
        q: "¿Dónde me encuentro con el grupo?",
        a: "El punto y la hora de encuentro están indicados en la página del paquete, en la sección \"Información de Salida\". También recibirás los detalles por correo al confirmar tu reserva.",
      },
      {
        q: "¿Qué incluye el paquete?",
        a: "Cada paquete detalla sus inclusiones (alimentación, transporte, guía, actividades, etc.) en la sección \"Lo que incluye este paquete\". Revisa bien antes de reservar.",
      },
      {
        q: "¿Qué pasa si no puedo asistir el día del viaje?",
        a: "Contacta al organizador del paquete con la mayor anticipación posible a través del chat de la plataforma o al número de contacto indicado.",
      },
    ],
  },
  {
    category: "Organizadores",
    items: [
      {
        q: "¿Cómo publico mi paquete turístico?",
        a: "Regístrate, cambia tu rol a Anfitrión desde tu perfil y crea tu primer paquete completando los pasos: categoría, descripción, ubicación de salida, amenidades y precio.",
      },
      {
        q: "¿Cuándo recibo el pago por mis paquetes?",
        a: "El pago se transfiere al organizador luego de que finalice el servicio y quede confirmado. Puedes hacer seguimiento desde tu panel de anfitrión.",
      },
      {
        q: "¿Puedo ofrecer planes Básico y Premium en el mismo paquete?",
        a: "Sí. Al crear o editar tu paquete puedes configurar ambos planes con distintos precios e inclusiones para que los viajeros elijan según su presupuesto.",
      },
    ],
  },
  {
    category: "Cuenta",
    items: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ve a Configuración en tu panel y selecciona la opción de cambiar contraseña, o usa \"Olvidé mi contraseña\" en el inicio de sesión.",
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
          Encuentra respuestas a las preguntas más frecuentes sobre Destinos Venezuela.
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
