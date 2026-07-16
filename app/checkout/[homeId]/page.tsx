import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import CheckoutForm from "@/app/components/CheckoutForm";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import Link from "next/link";
import { getPrimaryCategoryName } from "@/app/lib/property-categories";
import {
  getPagoMovilConfig,
  type PagoMovilMode,
} from "@/app/lib/pagomovil-config";

function formatBsAmount(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatBcvRate(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(value);
}

async function getHomeData(homeId: string) {
  noStore();
  const home = await (prisma as any).home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      title: true,
      price: true,
      priceVip: true,
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
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    guests?: string;
    plan?: string;
    seatId?: string;
    seatIds?: string;
    flow?: string;
    target?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/api/auth/login");
  }

  const { homeId } = await params;
  const { startDate, endDate, guests, plan, seatId, seatIds, flow, target } =
    await searchParams;
  const isSavingsFlow = flow === "ahorro";
  const isGeneralSavings =
    isSavingsFlow && (target === "general" || homeId === "general");
  const resolvedSeatIds = (() => {
    const parsed = (seatIds || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (parsed.length > 0) return parsed;
    if (seatId) return [seatId];
    return [];
  })();

  const planLabel = plan === "vip" ? "Plan Premium VIP" : "Plan Estándar";

  // Si no hay fechas, usar una noche simbólica para paquetes
  const resolvedStartDate = startDate || new Date().toISOString().split("T")[0];
  const resolvedEndDate =
    endDate || new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const home = await getHomeData(homeId);

  if (!home && !isGeneralSavings) {
    return redirect("/");
  }

  // ── Flujo de ahorro: renderizar formulario de cuota ──────────────────────────
  if (isSavingsFlow) {
    const parsedGuestsCount = guests ? parseInt(guests, 10) : 1;
    const savingsGuestsCount =
      Number.isInteger(parsedGuestsCount) && parsedGuestsCount > 0
        ? parsedGuestsCount
        : 1;
    const [platformCfg, savingsRows] = await Promise.all([
      (prisma as any).platformConfig.findFirst({
        select: { bcvRate: true, bcvRateDate: true },
      }),
      (prisma as any).saving.findMany({
        where: { userId: user.id },
        select: { amountUsd: true, status: true, paymentDetails: true },
      }),
    ]);
    const bcvRateSavings = platformCfg?.bcvRate
      ? Number(platformCfg.bcvRate)
      : 0;
    const hasValidBcvRateSavings =
      Number.isFinite(bcvRateSavings) && bcvRateSavings > 0;
    const bcvDateLabelSavings = platformCfg?.bcvRateDate
      ? new Date(platformCfg.bcvRateDate).toLocaleDateString("es-VE")
      : null;

    const getSavingHomeId = (paymentDetails: unknown) => {
      if (
        !paymentDetails ||
        typeof paymentDetails !== "object" ||
        Array.isArray(paymentDetails)
      )
        return null;
      const v = (paymentDetails as { homeId?: unknown }).homeId;
      return typeof v === "string" && v.trim() ? v.trim() : null;
    };

    // Saldo ya ahorrado para este paquete (APROBADO)
    const packageSavedUsd = isGeneralSavings
      ? 0
      : Number(
          savingsRows
            .reduce((sum: number, s: any) => {
              const usd = Number(s.amountUsd ?? 0);
              const savingHomeId = getSavingHomeId(s.paymentDetails);
              if (savingHomeId !== homeId) return sum;
              if (usd < 0) return sum + usd;
              if (s.status !== "APPROVED") return sum;
              return sum + usd;
            }, 0)
            .toFixed(2),
        );

    // Meta del paquete según plan y huéspedes
    const goalUsd = (() => {
      if (isGeneralSavings || !home) return 0;
      const unit =
        plan === "vip" && Number(home.priceVip ?? 0) > 0
          ? Number(home.priceVip)
          : Number(home.price ?? 0);
      return Math.round(unit * savingsGuestsCount * 100) / 100;
    })();
    const remainingUsd = Math.max(
      0,
      Math.round((goalUsd - packageSavedUsd) * 100) / 100,
    );

    const packageTitle = isGeneralSavings
      ? "Alcancía general"
      : (home?.title ?? "Paquete");
    const primaryCategorySavings = home
      ? getPrimaryCategoryName(home.categoryName)
      : null;

    return (
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">
          {isGeneralSavings
            ? "Abonar a tu alcancía general"
            : "Registrar abono al paquete"}
        </h1>

        <div className="space-y-6">
          {/* Tarjeta del destino del ahorro */}
          <div className="bg-white rounded-lg border p-4">
            <div className="flex gap-4">
              {home?.photo ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <SupabaseImage
                    imagePath={home.photo}
                    alt={home.title || "Paquete"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-orange-300 flex items-center justify-center text-3xl">
                  🐷
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  {isGeneralSavings
                    ? "Ahorro libre sin destino fijo"
                    : primaryCategorySavings === "apartamento"
                      ? "Apartamento entero"
                      : primaryCategorySavings === "casa"
                        ? "Casa entera"
                        : primaryCategorySavings === "lujo"
                          ? "Villa de lujo"
                          : "Paquete"}
                </p>
                <h3 className="font-semibold text-lg mb-1">{packageTitle}</h3>
                {!isGeneralSavings && goalUsd > 0 && (
                  <p className="text-xs text-gray-500">
                    Meta: <strong>${goalUsd.toFixed(2)}</strong> · Ahorrado:{" "}
                    <strong>${packageSavedUsd.toFixed(2)}</strong> · Falta:{" "}
                    <strong className="text-orange-600">
                      ${remainingUsd.toFixed(2)}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resumen del abono */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Detalle del abono</h2>
            <p className="text-sm text-gray-600">
              Indica abajo el monto que deseas abonar. Puedes pagar la meta
              completa o sólo una cuota parcial. Cuando completes el monto total
              del paquete podrás reservar tus fechas.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              {hasValidBcvRateSavings
                ? `Tasa BCV del día: Bs ${formatBcvRate(bcvRateSavings)} por USD${bcvDateLabelSavings ? ` (${bcvDateLabelSavings})` : ""}`
                : "No hay tasa BCV configurada para calcular el monto en bolívares."}
            </p>
          </div>

          {/* Formulario unificado en modo ahorro */}
          <CheckoutForm
            homeId={isGeneralSavings ? "general" : homeId}
            userId={user.id}
            startDate=""
            endDate=""
            guests={savingsGuestsCount}
            nights={0}
            subtotal={0}
            total={0}
            bcvRate={bcvRateSavings}
            totalBs={0}
            savingsTotalUsd={0}
            seatId={resolvedSeatIds[0]}
            seatIds={resolvedSeatIds}
            plan={plan}
            savingsFlow={{
              kind: isGeneralSavings ? "general" : "package",
              goalUsd,
              alreadySavedUsd: packageSavedUsd,
              remainingUsd,
              packageTitle,
            }}
          />
        </div>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────────

  if (plan === "vip" && (!home.priceVip || home.priceVip <= 0)) {
    return redirect(`/home/${homeId}`);
  }

  if (plan !== "vip" && (!home.price || home.price <= 0)) {
    return redirect(`/home/${homeId}`);
  }

  // Seleccionar precio según plan
  const selectedPrice =
    plan === "vip" ? (home.priceVip as number) : (home.price as number);

  // Calcular cantidad de noches
  const start = new Date(resolvedStartDate);
  const end = new Date(resolvedEndDate);
  const startTime = start.getTime();
  const endTime = end.getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return redirect(`/home/${homeId}`);
  }

  const nights = Math.max(
    1,
    Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)),
  );

  // Para paquetes (plan estandar/vip), el precio es por cupo, no por noche
  const isPackage = !startDate || !endDate;
  const effectiveNights = isPackage ? 1 : nights;

  // Calcular totales (tarifa por persona)
  const parsedGuests = guests ? parseInt(guests, 10) : 1;
  const guestsCount =
    Number.isInteger(parsedGuests) && parsedGuests > 0 ? parsedGuests : 1;
  const subtotal = selectedPrice * effectiveNights * guestsCount;
  const total = subtotal;

  const platformConfig = await (prisma as any).platformConfig.findFirst({
    select: {
      bcvRate: true,
      bcvRateDate: true,
    },
  });

  const getSavingHomeId = (paymentDetails: unknown) => {
    if (
      !paymentDetails ||
      typeof paymentDetails !== "object" ||
      Array.isArray(paymentDetails)
    ) {
      return null;
    }

    const homeIdValue = (paymentDetails as { homeId?: unknown }).homeId;
    return typeof homeIdValue === "string" && homeIdValue.trim()
      ? homeIdValue.trim()
      : null;
  };

  // Solo contar ahorros APROBADOS para el saldo disponible
  const savingsApproved = await (prisma as any).saving.findMany({
    where: { userId: user.id },
    select: { amountUsd: true, status: true, paymentDetails: true },
  });
  const savingsEligibleUsd = Number(
    savingsApproved
      .reduce((sum: number, s: any) => {
        const usd = Number(s.amountUsd ?? 0);
        const savingHomeId = getSavingHomeId(s.paymentDetails);

        if (usd < 0) {
          if (!savingHomeId || savingHomeId === homeId) {
            return sum + usd;
          }

          return sum;
        }

        if (s.status !== "APPROVED") {
          return sum;
        }

        if (!savingHomeId || savingHomeId === homeId) {
          return sum + usd;
        }

        return sum;
      }, 0)
      .toFixed(2),
  );
  const bcvRate = platformConfig?.bcvRate ? Number(platformConfig.bcvRate) : 0;
  const hasValidBcvRate = Number.isFinite(bcvRate) && bcvRate > 0;
  const totalBs = hasValidBcvRate ? Number((total * bcvRate).toFixed(2)) : 0;
  const bcvRateDateLabel = platformConfig?.bcvRateDate
    ? new Date(platformConfig.bcvRateDate).toLocaleDateString("es-VE")
    : null;

  // Calcular rating promedio
  const reviews = home.Review || [];
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
          reviews.length
        ).toFixed(1)
      : null;
  const primaryCategory = getPrimaryCategoryName(home.categoryName);

  const pagomovilConfig = await getPagoMovilConfig();

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
                {primaryCategory === "apartamento"
                  ? "Apartamento entero"
                  : primaryCategory === "casa"
                    ? "Casa entera"
                    : primaryCategory === "lujo"
                      ? "Villa de lujo"
                      : "Alojamiento entero"}
              </p>
              <h3 className="font-semibold text-lg mb-1">{home.title}</h3>
              {avgRating && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-orange-500">★</span>
                  <span className="font-medium">{avgRating}</span>
                  <span className="text-gray-500">
                    ({home._count.Review} reseña
                    {home._count.Review !== 1 ? "s" : ""})
                  </span>
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
                    {new Date(resolvedStartDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    -{" "}
                    {new Date(resolvedEndDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <Link
                  href={`/home/${homeId}`}
                  className="text-sm font-semibold underline hover:text-gray-600"
                >
                  Editar
                </Link>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium mb-1">Cupos</p>
                  <p className="text-sm text-gray-600">
                    {guests || 1} cupo
                    {guests && parseInt(guests) > 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  href={`/seats/${homeId}/passengers?plan=${plan || "estandar"}&flow=contado`}
                  className="text-sm font-semibold underline hover:text-gray-600"
                >
                  Editar
                </Link>
              </div>
              {resolvedSeatIds.length > 0 && (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Asiento{resolvedSeatIds.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-gray-600 font-semibold text-amber-600">
                      {planLabel} · {resolvedSeatIds.length} seleccionado
                      {resolvedSeatIds.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/seats/${homeId}?plan=${plan || "estandar"}&flow=contado&guests=${guestsCount}`}
                    className="text-sm font-semibold underline hover:text-gray-600"
                  >
                    Cambiar
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Detalle del precio */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Detalle del precio</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {planLabel} — ${selectedPrice} × {guestsCount} cupo
                  {guestsCount > 1 ? "s" : ""}
                </span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total a pagar (USD)</span>
                  <span className="text-lg font-bold text-orange-500">
                    {/** El guest solo paga el subtotal */}${total.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold">Total a pagar (Bs)</span>
                  <span className="text-lg font-bold text-blue-600">
                    {hasValidBcvRate
                      ? `Bs ${formatBsAmount(totalBs)}`
                      : "No disponible"}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {hasValidBcvRate
                    ? `Tasa BCV del día: Bs ${formatBcvRate(bcvRate)} por USD${bcvRateDateLabel ? ` (${bcvRateDateLabel})` : ""}`
                    : "No hay tasa BCV configurada para calcular el total en bolívares."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de pago */}
        <CheckoutForm
          homeId={homeId}
          userId={user.id}
          startDate={resolvedStartDate}
          endDate={resolvedEndDate}
          guests={guestsCount}
          nights={nights}
          subtotal={subtotal}
          total={total}
          bcvRate={bcvRate}
          totalBs={totalBs}
          savingsTotalUsd={savingsEligibleUsd}
          seatId={resolvedSeatIds[0]}
          seatIds={resolvedSeatIds}
          plan={plan}
          pagomovilMode={pagomovilConfig.mode}
          merchantPhone={pagomovilConfig.merchant.phone}
          merchantBank={pagomovilConfig.merchant.bank}
          merchantCedula={pagomovilConfig.merchant.cedula}
        />
      </div>
    </div>
  );
}
