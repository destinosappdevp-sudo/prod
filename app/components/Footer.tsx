import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, MessageCircle, AtSign } from "lucide-react";

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
              <Link href="/terminos" className="transition-colors hover:text-[#f0c85c]">Términos y condiciones</Link>
              <Link href="/ayuda" className="transition-colors hover:text-[#f0c85c]">Preguntas Frecuentes</Link>
              <Link href="/privacidad" className="transition-colors hover:text-[#f0c85c]">Política de privacidad</Link>
              <Link href="/contacto" className="transition-colors hover:text-[#f0c85c]">Contacto</Link>
            </div>
            <div className="mx-auto h-px w-full max-w-[560px] bg-white/45" />
            <p className="text-xs text-white/80">
              © {currentYear} Destino&apos;s - Todos los derechos reservados. Desarrollado Por FocusDev C.A
            </p>
          </div>

          <div className="flex justify-center gap-4 text-[#f0c85c] lg:justify-end">
            <a href="https://www.facebook.com/manueld3/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80">
              <Facebook size={28} />
            </a>
            <a href="https://www.instagram.com/destinosvzla_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80">
              <Instagram size={28} />
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
