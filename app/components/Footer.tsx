import Link from "next/link";
import Image from "next/image";
import { MessageCircle, AtSign } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-0 overflow-hidden bg-brand-blue text-white">
      <div className="relative container mx-auto px-4 py-16 sm:px-5 lg:px-10">
        <div className="grid items-start gap-8 lg:grid-cols-[220px_1fr_200px]">
          <div className="flex justify-center lg:justify-start">
            <Image
              src="/media/logo-destinos.webp"
              alt="Logo Destinos"
              width={128}
              height={46}
              className="h-auto w-[118px]"
            />
          </div>

          <div className="space-y-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-white/95">
              <Link href="/terminos" className="transition-colors hover:text-[#f0c85c]">T�rminos y condiciones</Link>
              <Link href="/ayuda" className="transition-colors hover:text-[#f0c85c]">Preguntas Frecuentes</Link>
              <Link href="/privacidad" className="transition-colors hover:text-[#f0c85c]">Pol�tica de privacidad</Link>
              <Link href="/contacto" className="transition-colors hover:text-[#f0c85c]">Contacto</Link>
            </div>
            <div className="mx-auto h-px w-full max-w-[560px] bg-white/45" />
            <p className="text-xs text-white/80">
              � {currentYear} Destino&apos;s - Todos los derechos reservados. Desarrollado Por FocusDev C.A
            </p>
          </div>

          <div className="flex justify-center gap-4 text-[#f0c85c] lg:justify-end">
            <a href="https://www.facebook.com/manueld3/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.98 3.66 9.12 8.44 9.93v-7.03H8.08v-2.9h2.36V9.41c0-2.33 1.38-3.62 3.5-3.62. 1.01 0 2.07.18 2.07.18v2.28h-1.17c-1.15 0-1.51.72-1.51 1.46v1.75h2.57l-.41 2.9h-2.16v7.03C18.34 21.19 22 17.05 22 12.07z" fill="currentColor"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/destinosvzla_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M8.5 11.99a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
              </svg>
            </a>
            <a href="https://www.threads.com/@destinosvzla_" target="_blank" rel="noopener noreferrer" aria-label="Threads" className="transition-opacity hover:opacity-80">
              <AtSign size={28} />
            </a>
            <a href="https://api.whatsapp.com/send/?phone=584245047025&text&type=phone_number&app_absent=0&utm_source=webdestinos" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="transition-opacity hover:opacity-80">
              <MessageCircle size={28} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}



