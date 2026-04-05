import Link from "next/link";
import FooterAccountLinks from "./FooterAccountLinks";

const footerColumns = [
  {
    title: "Somos Destinos Venezuela",
    links: [
      { label: "Preguntas frecuentes", href: "/ayuda" },
    ],
  },
  {
    title: "Confianza al reservar",
    links: [
      { label: "Términos y condiciones", href: "/terminos" },
      { label: "Política de privacidad", href: "/privacidad" },
      { label: "Promociones actuales", href: "/novedades" },
    ],
  },
  {
    title: "Impulsa tu negocio",
    links: [
      { label: "Únete a tu flota", href: "/unete-flota" },
      { label: "Anuncie su propiedad", href: "/publicar" },
      { label: "Conviértete en Inversor", href: "/socio-premium" },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#152a6b] via-[#182b73] to-[#11245d] text-blue-100">
      {/* Main content */}
      <div className="container mx-auto px-5 lg:px-10 py-12">
        {/* Top row: brand */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <span className="text-2xl font-bold text-white tracking-wide">Destinos Venezuela</span>
        </div>

        {/* 4-column links grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Mi cuenta — auth-aware links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Mi cuenta
            </h3>
            <FooterAccountLinks />
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-blue-100/80 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#2c4ea9]">
        <div className="container mx-auto px-5 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200/75">
          <p>© {currentYear} Destinos Venezuela · Venezuela · Todos los derechos reservados</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
