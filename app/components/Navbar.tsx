import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/destinos", label: "Destinos" },
  { href: "/socio-premium", label: "Ahorrar" },
  { href: "/contacto", label: "Contacto" },
];

function Navbar() {
  return (
    <header className="w-full border-b border-brand-blue bg-brand-blue text-white">
      <div className="container mx-auto flex h-[84px] items-center justify-between px-4 sm:px-5 lg:px-10">
        <Link href="/" className="shrink-0">
          <Image
            src="/media/logo-destinos.webp"
            alt="Logo Destinos"
            width={128}
            height={46}
            className="h-auto w-[96px] sm:w-[108px] lg:w-[128px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-10 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-lg font-medium tracking-wide text-white/95 transition-colors hover:text-[#f0c85c] ${
                link.href === "/" ? "border-b-2 border-[#f0c85c] pb-1" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-3 text-[#f0c85c]">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80">
              <Facebook size={20} />
            </a>
            <a href="https://www.instagram.com/destinosvzla_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80">
              <Instagram size={20} />
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="transition-opacity hover:opacity-80">
              <Twitter size={20} />
            </a>
          </div>
          <Link
            href="/login"
            className="rounded-md bg-[#f0c85c] px-6 py-2.5 text-base font-semibold text-[#0b1f5a] transition-colors hover:bg-[#ddb451]"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href="/login"
            className="rounded-md bg-[#f0c85c] px-3 py-2 text-sm font-semibold text-[#0b1f5a]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className="border-t border-white/20 lg:hidden">
        <nav className="container mx-auto flex items-center justify-between px-4 py-2 text-sm text-white/95 sm:px-5">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[#f0c85c]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
