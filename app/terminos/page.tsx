export default function TerminosPage() {
  return (
    <main className="container mx-auto max-w-3xl px-5 lg:px-10 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Términos y Condiciones de Destinos Venezuela C.A.
      </h1>
      <p className="text-sm text-gray-500 mb-10">Última actualización: 19 de Marzo 2026</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introducción</h2>
          <p>
            Destinos Venezuela C.A., con domicilio en Caracas, Venezuela, ofrece una plataforma digital que
            conecta anfitriones que desean alquilar sus propiedades (casas, apartamentos,
            habitaciones) con huéspedes interesados en reservarlas. Al acceder y utilizar nuestros
            servicios, usted acepta estos Términos y Condiciones.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Definiciones</h2>
          <ul className="space-y-1.5 list-none pl-0">
            <li><span className="font-semibold">Plataforma:</span> Sitio web y aplicación de Destinos Venezuela C.A.</li>
            <li><span className="font-semibold">Anfitrión:</span> Persona o entidad que publica una propiedad para alquiler.</li>
            <li><span className="font-semibold">Huésped:</span> Persona que reserva y utiliza una propiedad publicada.</li>
            <li><span className="font-semibold">Propiedad:</span> Inmueble ofrecido para alquiler temporal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Uso de la Plataforma</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Los usuarios deben ser mayores de 18 años.</li>
            <li>
              Es responsabilidad del anfitrión garantizar que la propiedad cumpla con las leyes
              locales y condiciones de seguridad.
            </li>
            <li>
              Los huéspedes deben utilizar la propiedad de manera responsable y conforme a las
              normas establecidas por el anfitrión.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Reservas y Pagos</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Las reservas se realizan exclusivamente a través de la plataforma.</li>
            <li>Los pagos se procesan mediante los métodos habilitados por Destinos Venezuela C.A.</li>
            <li>
              Destinos Venezuela C.A. cobra una comisión por cada transacción, la cual será informada al
              momento de la reserva.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cancelaciones y Reembolsos</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>
              Las políticas de cancelación son definidas por cada anfitrión y visibles en la
              publicación de la propiedad.
            </li>
            <li>
              Destinos Venezuela C.A. actuará como intermediario en la gestión de reembolsos, según las
              políticas aplicables.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Responsabilidades</h2>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>
              Destinos Venezuela C.A. no es propietaria de los inmuebles publicados y no garantiza la
              veracidad de la información proporcionada por los anfitriones.
            </li>
            <li>
              Los anfitriones son responsables de la legalidad y condiciones de sus propiedades.
            </li>
            <li>
              Los huéspedes son responsables de cualquier daño causado durante su estadía.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Limitación de Responsabilidad</h2>
          <p className="mb-2">Destinos Venezuela C.A. no será responsable por:</p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>Accidentes, daños o pérdidas ocurridas en las propiedades.</li>
            <li>Incumplimientos entre anfitriones y huéspedes fuera de la plataforma.</li>
            <li>Fuerza mayor o eventos fuera de nuestro control.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Privacidad y Datos Personales</h2>
          <p>
            Destinos Venezuela C.A. recopila y procesa datos personales conforme a la legislación venezolana
            vigente. El uso de la plataforma implica la aceptación de nuestra Política de
            Privacidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
          <p>
            Destinos Venezuela C.A. se reserva el derecho de modificar estos Términos y Condiciones en
            cualquier momento. Las modificaciones entrarán en vigor una vez publicadas en la
            plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Legislación Aplicable</h2>
          <p>
            Estos Términos y Condiciones se rigen por las leyes de la República Bolivariana de
            Venezuela. Cualquier disputa será resuelta en los tribunales competentes de Caracas.
          </p>
        </section>

      </div>
    </main>
  );
}
