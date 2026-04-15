import { ChevronDown, Star } from "lucide-react";

const reviews = [
  {
    name: "María González",
    initials: "MG",
    city: "Caracas",
    date: "Marzo 2025",
    text: "El viaje a Los Roques superó mis expectativas. El servicio fue impecable y la atención excelente en todo momento.",
    accent: "bg-[#E0AE33] text-[#040B42]",
  },
  {
    name: "Carlos Ramírez",
    initials: "CR",
    city: "Valencia",
    date: "Febrero 2025",
    text: "Organización perfecta, hoteles de primera y atención al cliente excepcional. Sin duda, una experiencia muy confiable.",
    accent: "bg-sky-600 text-white",
    featured: true,
  },
  {
    name: "Luisa Peña",
    initials: "LP",
    city: "Maracaibo",
    date: "Enero 2025",
    text: "Viajamos en familia a Canaima y fue una experiencia inolvidable. El guía fue muy profesional y el viaje estuvo excelente.",
    accent: "bg-emerald-600 text-white",
  },
];

export default function ReviewsSection() {
  return (
    <section className="mt-0 w-full overflow-hidden bg-[#040B42] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#E0AE33] sm:text-base">
            Lo que dicen nuestros viajeros
          </p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Reseñas de clientes</h2>
          <div className="mt-3 flex items-center justify-center gap-2 text-lg text-white/90">
            <div className="flex items-center gap-1 text-[#E0AE33]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="font-medium">4.9 de 5 · 328 reseñas verificadas</span>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className={`rounded-[22px] border p-6 shadow-sm transition-transform duration-300 ${
                review.featured
                  ? "border-[#E0AE33] bg-[#1a286a] shadow-[0_0_0_1px_rgba(224,174,51,0.35)]"
                  : "border-white/15 bg-[#18255f] hover:scale-105"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-[#E0AE33]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={`h-4 w-4 ${index === 4 && review.name === "Luisa Peña" ? "fill-none text-white/70" : "fill-current"}`} />
                  ))}
                </div>
                {review.featured && (
                  <span className="rounded-full bg-[#E0AE33] px-3 py-1 text-xs font-semibold text-[#040B42]">
                    Destacada
                  </span>
                )}
              </div>

              <p className="line-clamp-3 min-h-[92px] text-lg leading-8 text-white/95">
                “{review.text}”
              </p>

              <div className="mt-5 border-t border-white/15 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold ${review.accent}`}>
                    {review.initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{review.name}</p>
                    <p className="text-sm text-white/60">{review.city} · {review.date}</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="https://www.google.com/search?sca_esv=b23efcb65468375a&sxsrf=ANbL-n6lXfvjp5HaUpGIrk_GDRk4wnq4Vg:1776260361530&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOQTg3ZDGJmtykoD-01umOUFSmlW7Kjp0fgaoMWyrfylc0i45R4xvj-KW7oV8mb2dtLoDsGTanfr-aARW-9uy5cb25GNxgbUZp80oIPJCqM3u6uFE8PdyJVWlfcHrq_7Bmm6PIkvo0UXvxqJFOJAhCQX82qjI&q=Destinos+Venezuela+C.A.+Agencia+de+Viajes+y+Turismo+Opiniones&sa=X&ved=2ahUKEwjCpIK__e-TAxXaRTABHSX6EGgQ0bkNegQIIRAH&biw=1528&bih=698&dpr=1.25"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-[#E0AE33] hover:text-[#E0AE33]"
          >
            Ver todas las reseñas
            <ChevronDown className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
