export default function PrivacidadPage() {
  return (
    <main className="container mx-auto px-5 lg:px-10 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-gray-400 mb-10">Última actualización: abril de 2026</p>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Quiénes somos</h2>
          <p>
            Destinos Venezuela es una plataforma digital que conecta a viajeros con organizadores
            de paquetes turísticos dentro del territorio venezolano. Operamos en Venezuela y nos
            comprometemos a proteger la privacidad de todos nuestros usuarios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Información que recopilamos</h2>
          <p className="mb-3">Al usar Destinos Venezuela podemos recopilar los siguientes datos:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><span className="font-medium">Datos de registro:</span> nombre, dirección de correo electrónico y contraseña.</li>
            <li><span className="font-medium">Datos de perfil:</span> foto de perfil, número de teléfono y documentos de identificación (cuando aplique para verificación de anfitrión).</li>
            <li><span className="font-medium">Datos de reserva:</span> destinos seleccionados, fechas, cantidad de cupos y métodos de pago utilizados.</li>
            <li><span className="font-medium">Datos de uso:</span> páginas visitadas, búsquedas realizadas, interacciones con listados y tiempo de sesión.</li>
            <li><span className="font-medium">Datos técnicos:</span> dirección IP, tipo de dispositivo, navegador y sistema operativo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cómo usamos tu información</h2>
          <p className="mb-3">Utilizamos los datos recopilados para:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Procesar y confirmar reservas de paquetes turísticos.</li>
            <li>Enviar notificaciones relacionadas con tus reservas (confirmaciones, recordatorios, cambios).</li>
            <li>Mejorar la experiencia de uso de la plataforma.</li>
            <li>Prevenir fraudes y garantizar la seguridad de las transacciones.</li>
            <li>Cumplir con obligaciones legales aplicables en Venezuela.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Compartir información con terceros</h2>
          <p className="mb-3">
            No vendemos ni alquilamos tu información personal a terceros. Podemos compartir datos
            en los siguientes casos limitados:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><span className="font-medium">Organizadores del paquete:</span> compartimos tu nombre y datos de contacto con el organizador del destino que reservaste, únicamente para coordinar tu participación.</li>
            <li><span className="font-medium">Proveedores de servicios:</span> utilizamos servicios externos de infraestructura (alojamiento, base de datos, pagos) que procesan datos bajo acuerdos de confidencialidad.</li>
            <li><span className="font-medium">Obligaciones legales:</span> si una autoridad competente lo requiere mediante orden judicial o disposición legal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en servidores seguros con cifrado en tránsito (HTTPS) y en
            reposo. Utilizamos controles de acceso para limitar quién puede acceder a tu
            información dentro de nuestro equipo. Sin embargo, ningún sistema es completamente
            infalible, por lo que te recomendamos usar contraseñas seguras y no compartirlas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies y tecnologías similares</h2>
          <p>
            Usamos cookies de sesión necesarias para el funcionamiento de la plataforma
            (autenticación, preferencias). No utilizamos cookies de publicidad de terceros.
            Puedes desactivar las cookies desde la configuración de tu navegador, aunque esto
            puede afectar el funcionamiento de algunas funciones del sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Tus derechos</h2>
          <p className="mb-3">Como usuario tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><span className="font-medium">Acceso:</span> solicitar una copia de los datos personales que tenemos sobre ti.</li>
            <li><span className="font-medium">Rectificación:</span> corregir datos inexactos o desactualizados desde tu perfil o contactándonos.</li>
            <li><span className="font-medium">Eliminación:</span> solicitar la eliminación de tu cuenta y datos asociados a través de la opción &ldquo;Eliminar mi cuenta&rdquo; en la plataforma.</li>
            <li><span className="font-medium">Portabilidad:</span> solicitar tus datos en un formato estructurado.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos escríbenos a{" "}
            <a href="mailto:soporte@destinosvenezuela.com" className="text-blue-600 hover:underline">
              soporte@destinosvenezuela.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Retención de datos</h2>
          <p>
            Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta,
            borraremos tus datos personales en un plazo máximo de 30 días, salvo que la ley
            exija conservarlos por un período mayor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Menores de edad</h2>
          <p>
            Destinos Venezuela no está dirigido a menores de 18 años. No recopilamos
            intencionalmente información de menores. Si detectamos que un menor ha creado una
            cuenta, la eliminaremos de inmediato.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política cuando sea necesario. Te notificaremos por correo
            electrónico o mediante un aviso en la plataforma ante cambios significativos. El uso
            continuado de Destinos Venezuela después de la notificación implica aceptación de
            los cambios.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política o sobre el tratamiento de tus datos, contáctanos en{" "}
            <a href="mailto:soporte@destinosvenezuela.com" className="text-blue-600 hover:underline">
              soporte@destinosvenezuela.com
            </a>.
          </p>
        </section>

      </div>
    </main>
  );
}




