import Link from "next/link";

export default function ContactoPage() {
  return (
    <main className="bg-[#E5DCC6]">
      <section className="container mx-auto max-w-5xl px-5 py-14 lg:px-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-[#040B42]">Contacto</h1>
          <p className="mt-2 text-lg text-[#1c2d62]">
            Escríbenos y te respondemos lo antes posible.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form className="rounded-2xl border border-[#d4c8a9] bg-white/90 p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-[#040B42]">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  className="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#E0AE33]"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-[#040B42]">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  className="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#E0AE33]"
                  placeholder="0424 0000000"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#040B42]">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#E0AE33]"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="asunto" className="mb-1 block text-sm font-medium text-[#040B42]">
                Asunto
              </label>
              <input
                id="asunto"
                name="asunto"
                type="text"
                required
                className="w-full rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#E0AE33]"
                placeholder="¿En qué podemos ayudarte?"
              />
            </div>

            <div className="mt-4">
              <label htmlFor="mensaje" className="mb-1 block text-sm font-medium text-[#040B42]">
                Mensaje
              </label>
              <textarea
                id="mensaje"
                name="mensaje"
                rows={6}
                required
                className="w-full resize-none rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#E0AE33]"
                placeholder="Escribe tu mensaje..."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg px-6 py-2.5 text-base font-semibold"
              >
                Enviar mensaje
              </button>

              <Link
                href="https://api.whatsapp.com/send/?phone=584245047025&text&type=phone_number&app_absent=0&utm_source=webdestinos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-[#E0AE33] bg-transparent px-6 py-2.5 text-base font-semibold text-[#040B42] transition-colors hover:bg-[#f7e7b6]"
              >
                WhatsApp directo
              </Link>
            </div>
          </form>

          <aside className="rounded-2xl border border-[#d4c8a9] bg-[#040B42] p-6 text-white shadow-sm">
            <h2 className="text-xl font-semibold">Atención</h2>
            <p className="mt-2 text-sm text-white/85">
              También puedes escribirnos por redes o por WhatsApp para consultas rápidas.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <span className="font-semibold text-[#E0AE33]">Facebook:</span>{" "}
                <a
                  href="https://www.facebook.com/manueld3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E0AE33]/70 underline-offset-2 hover:text-[#E0AE33]"
                >
                  Manuel D
                </a>
              </p>
              <p>
                <span className="font-semibold text-[#E0AE33]">Instagram:</span>{" "}
                <a
                  href="https://www.instagram.com/destinosvzla_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E0AE33]/70 underline-offset-2 hover:text-[#E0AE33]"
                >
                  @destinosvzla_
                </a>
              </p>
              <p>
                <span className="font-semibold text-[#E0AE33]">Threads:</span>{" "}
                <a
                  href="https://www.threads.com/@destinosvzla_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E0AE33]/70 underline-offset-2 hover:text-[#E0AE33]"
                >
                  @destinosvzla_
                </a>
              </p>
              <p>
                <span className="font-semibold text-[#E0AE33]">WhatsApp:</span>{" "}
                <a
                  href="https://api.whatsapp.com/send/?phone=584245047025&text&type=phone_number&app_absent=0&utm_source=webdestinos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#E0AE33]/70 underline-offset-2 hover:text-[#E0AE33]"
                >
                  0424-5047025
                </a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}



