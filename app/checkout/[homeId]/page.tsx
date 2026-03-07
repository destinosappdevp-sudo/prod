import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import CheckoutForm from "@/app/components/CheckoutForm";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import Link from "next/link";

async function getHomeData(homeId: string) {
  noStore();
  const home = await (prisma as any).home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      title: true,
      price: true,
      photo: true,
      country: true,
      municipality: true,
      categoryName: true,
      Review: {
        select: {
          rating: true,
        },
      },
      _count: {
        select: {
          Review: true,
        },
      },
    },
  });
  return home;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { homeId: string };
  searchParams: { startDate?: string; endDate?: string; guests?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/api/auth/login");
  }

  const { startDate, endDate, guests } = searchParams;

  if (!startDate || !endDate) {
    return redirect(`/home/${params.homeId}`);
  }

  const home = await getHomeData(params.homeId);

  if (!home || !home.price) {
    return redirect("/");
  }

  // Calcular cantidad de noches
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    return redirect(`/home/${params.homeId}`);
  }

  // Calcular totales (tarifa por persona)
  const guestsCount = guests ? parseInt(guests) : 1;
  // El guest paga el precio base + comisión, el host recibe el monto completo
  const subtotal = home.price * nights * guestsCount;
  const serviceFee = subtotal * 0.1; // 10% de tarifa de servicio
  const total = subtotal; // El guest solo paga el subtotal

  // Calcular rating promedio
  const reviews = home.Review || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Confirmar y Pagar</h1>
      
      <div className="space-y-6">
        {/* Tarjeta de la Propiedad */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex gap-4">
            {home.photo && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <SupabaseImage
                  imagePath={home.photo}
                  alt={home.title || "Propiedad"}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">
                {home.categoryName === "apartment" ? "Apartamento entero" :
                 home.categoryName === "house" ? "Casa entera" :
                 home.categoryName === "villa" ? "Villa entera" :
                 "Alojamiento entero"}
              </p>
              <h3 className="font-semibold text-lg mb-1">{home.title}</h3>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-orange-500">★</span>
                  <span className="font-medium">{avgRating}</span>
                  <span className="text-gray-500">({home._count.Review} reseña{home._count.Review !== 1 ? 's' : ''})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información de la reserva */}
        <div>
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Tu reserva</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1">Fechas</p>
                  <p className="text-sm text-gray-600">
                    {new Date(startDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(endDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <Link 
                  href={`/home/${params.homeId}`}
                  className="text-sm font-semibold underline hover:text-gray-600"
                >
                  Editar
                </Link>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1">Huéspedes</p>
                  <p className="text-sm text-gray-600">{guests || 1} huésped{(guests && parseInt(guests) > 1) ? 's' : ''}</p>
                </div>
                <Link 
                  href={`/home/${params.homeId}`}
                  className="text-sm font-semibold underline hover:text-gray-600"
                >
                  Editar
                </Link>
              </div>
            </div>
          </div>

          {/* Detalle del precio */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Detalle del precio</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  ${home.price} × {nights} noche{nights > 1 ? "s" : ""} × {guestsCount} huésped{guestsCount > 1 ? "es" : ""}
                </span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total a pagar (USD)</span>
                  <span className="text-lg font-bold text-orange-500">
                    {/** El guest solo paga el subtotal */}
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <CheckoutForm
          homeId={params.homeId}
          userId={user.id}
          startDate={startDate}
          endDate={endDate}
          nights={nights}
          subtotal={subtotal}
          total={total}
        />
      </div>
    </div>
  );
}
