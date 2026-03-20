import Link from "next/link";
import FooterAccountLinks from "./FooterAccountLinks";

const footerColumns = [
  {
    title: "Somos ZerKKa",
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
        {/* Top row: brand + app badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <span className="text-2xl font-bold text-white tracking-wide">ZerKKa</span>
          <div className="flex items-center gap-3">
            {/* Google Play badge */}
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1a337a] hover:bg-[#213f96] transition border border-[#2c4ea9] rounded-lg px-4 py-2"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.18 23.76c.32.18.68.22 1.04.12l11.4-6.58-2.42-2.42-10.02 8.88zm-1.44-20.6A1.5 1.5 0 0 0 1.5 4.5v15a1.5 1.5 0 0 0 .24.84l.06.06 8.4-8.4v-.2L1.8 3.22l-.06.06zm17.04 8.22-2.4-1.4-2.7 2.7 2.7 2.7 2.42-1.4a1.72 1.72 0 0 0 0-2.6zM4.22.12L15.62 6.7 13.2 9.12 3.18.24A1.36 1.36 0 0 0 4.22.12z"/>
              </svg>
              <div className="leading-tight">
                <p className="text-[9px] text-blue-200/70 uppercase tracking-wide">Disponible en</p>
                <p className="text-sm font-semibold text-white">Google Play</p>
              </div>
            </a>
            {/* App Store badge */}
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1a337a] hover:bg-[#213f96] transition border border-[#2c4ea9] rounded-lg px-4 py-2"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="leading-tight">
                <p className="text-[9px] text-blue-200/70 uppercase tracking-wide">Descargar en</p>
                <p className="text-sm font-semibold text-white">App Store</p>
              </div>
            </a>
          </div>
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
          <p>© {currentYear} ZerKKa · Venezuela · Todos los derechos reservados</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
