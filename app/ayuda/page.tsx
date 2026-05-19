const faqs = [
  {
    category: "Reservas de Paquetes",
    items: [
      {
        q: "�C�mo reservo un paquete tur�stico?",
        a: "Explora los full days disponibles, selecciona el que te interesa, elige tu plan (B�sico o Premium) y presiona \"Reservar Cupo\". Completa el formulario de pago y listo.",
      },
      {
        q: "�Puedo cancelar mi reserva?",
        a: "Depende de la pol�tica del organizador del paquete. Puedes revisar los t�rminos de cancelaci�n en la p�gina del paquete antes de reservar.",
      },
      {
        q: "�C�mo s� si mi cupo fue confirmado?",
        a: "Recibir�s una notificaci�n por correo electr�nico y el estado de tu reserva cambiar� a \"Confirmada\" en tu panel de usuario.",
      },
      {
        q: "�Con cu�nta anticipaci�n debo reservar?",
        a: "Recomendamos reservar con al menos 48 horas de anticipaci�n para garantizar tu cupo. Algunos paquetes requieren mayor anticipaci�n seg�n el destino.",
      },
    ],
  },
  {
    category: "Pagos",
    items: [
      {
        q: "�Qu� m�todos de pago aceptan?",
        a: "Aceptamos Pago M�vil, Zelle, transferencia bancaria y tarjeta internacional.",
      },
      {
        q: "�Cu�ndo se procesa mi pago?",
        a: "El pago se procesa al confirmar tu cupo. El organizador del paquete recibir� el monto una vez completado el servicio.",
      },
      {
        q: "�Hay alg�n cargo de servicio?",
        a: "S�, Destinos Venezuela aplica una peque�a tarifa de servicio para cubrir los costos de la plataforma. El monto exacto se muestra en el resumen del pago antes de confirmar.",
      },
      {
        q: "�Los precios son en d�lares o bol�vares?",
        a: "Los precios se publican en USD. En la plataforma tambi�n ver�s el equivalente en Bs. calculado con la tasa BCV del d�a.",
      },
      {
        q: "�Puedo retirar en efectivo el dinero de la caja de ahorro?",
        a: "No. El dinero abonado en la caja de ahorro no puede retirarse en efectivo.",
      },
      {
        q: "�Puedo cambiar la fecha si estoy pagando por partes?",
        a: "S�, puedes solicitar cambio de fecha solo si a�n no has cancelado el 100% del paquete. El cambio est� sujeto a aprobaci�n del organizador.",
      },
      {
        q: "�Hay penalizaci�n por cambio de fecha?",
        a: "S�, seg�n el caso puede aplicarse una penalizaci�n de entre 30% y 40% del monto abonado.",
      },
    ],
  },
  {
    category: "Durante el Paquete",
    items: [
      {
        q: "�D�nde me encuentro con el grupo?",
        a: "El punto y la hora de encuentro est�n indicados en la p�gina del paquete, en la secci�n \"Informaci�n de Salida\". Tambi�n recibir�s los detalles por correo al confirmar tu reserva.",
      },
      {
        q: "�Qu� incluye el paquete?",
        a: "Cada paquete detalla sus inclusiones (alimentaci�n, transporte, gu�a, actividades, etc.) en la secci�n \"Lo que incluye este paquete\". Revisa bien antes de reservar.",
      },
      {
        q: "�Qu� pasa si no puedo asistir el d�a del viaje?",
        a: "Contacta al organizador del paquete con la mayor anticipaci�n posible a trav�s del chat de la plataforma o al n�mero de contacto indicado.",
      },
      {
        q: "Si ya pagu� todo y no asisto (No-show), �me reembolsan?",
        a: "No. En Full Days, cuando el cliente paga el 100% y no asiste el d�a del servicio, no aplica reembolso.",
      },
      {
        q: "Si yo cancelo mi viaje, �me devuelven el dinero?",
        a: "No. Si el cliente decide no asistir por cuenta propia, no aplica reembolso de los montos pagados.",
      },
      {
        q: "�Qu� pasa si la empresa cancela por motivos log�sticos?",
        a: "Si la cancelaci�n es por motivos log�sticos atribuibles a la agencia u organizador, corresponde reembolso del 100%.",
      },
    ],
  },
  {
    category: "Ahorro por Destino",
    items: [
      {
        q: "�Puedo cambiar de destino si ya inici� mi plan de ahorro?",
        a: "Para destinos como Margarita, Los Roques y Canaima, no se permite cambiar de destino una vez iniciado el plan de ahorro.",
      },
      {
        q: "�El plan de ahorro sirve para cualquier destino?",
        a: "No siempre. En destinos espec�ficos (Margarita, Los Roques y Canaima), el plan de ahorro es exclusivo para el destino seleccionado al inicio.",
      },
    ],
  },
  {
    category: "Cuenta",
    items: [
      {
        q: "�C�mo cambio mi contrase�a?",
        a: "Ve a Configuraci�n en tu panel y selecciona la opci�n de cambiar contrase�a, o usa \"Olvid� mi contrase�a\" en el inicio de sesi�n.",
      },
      {
        q: "�C�mo elimino mi cuenta?",
        a: "Puedes solicitar la eliminaci�n de tu cuenta desde Configuraci�n > Cuenta > Eliminar cuenta. El proceso es irreversible.",
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
          Encuentra respuestas a las preguntas m�s frecuentes sobre Destinos Venezuela.
        </p>
      </div>

      {/* Contacto r�pido */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900 text-lg mb-1">�No encuentras lo que buscas?</h2>
          <p className="text-gray-500 text-sm">Escr�benos y te respondemos a la brevedad posible.</p>
        </div>
        <a
          href="/contacto"
          className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
        >
          Contactar soporte
        </a>
      </div>

      {/* FAQs por categor�a */}
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
                      �
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



