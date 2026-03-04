import Link from "next/link";

const footerSections = [
  {
    title: "Asistencia",
    links: [
      { label: "Centro de ayuda", href: "/ayuda" },
      { label: "Seguridad", href: "/seguridad" },
      { label: "Cancelaciones", href: "/cancelaciones" },
      { label: "Accesibilidad", href: "/accesibilidad" },
    ],
  },
  {
    title: "Modo anfitrión",
    links: [
      { label: "Publica tu espacio", href: "/publicar" },
      { label: "Ofrece experiencias", href: "/experiencias" },
      { label: "Buscar coanfitrión", href: "/coanfitrion" },
      { label: "Recursos para anfitriones", href: "/recursos-host" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Novedades", href: "/novedades" },
      { label: "Sala de prensa", href: "/prensa" },
      { label: "Inversionistas", href: "/inversionistas" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t bg-gray-100">
      <div className="container mx-auto px-5 lg:px-10 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-700 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 text-sm text-gray-700">
          © {currentYear} Zerkka
        </div>
      </div>
    </footer>
  );
}
