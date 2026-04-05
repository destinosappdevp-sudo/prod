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
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#152a6b] via-[#182b73] to-[#11245d] text-blue-100">
      {/* Main content — oculto provisionalmente */}
      <div className="hidden container mx-auto px-5 lg:px-10 py-12">
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

          {/* Síguenos */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Síguenos</h3>
            <div className="flex gap-4">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-blue-100/80 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95C18.05 21.45 22 17.19 22 12z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-blue-100/80 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-blue-100/80 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
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
