import prisma from "@/app/lib/db";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { Card } from "@/components/ui/card";
import SavingActions from "../users/[userId]/savings/SavingActions";
import AddSavingDialog from "./AddSavingDialog";

const prismaAny = prisma as any;

function roundMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

async function getData() {
  unstable_noStore();

  const [savings, users, homes] = await Promise.all([
    prismaAny.saving.findMany({
      orderBy: [{ status: "asc" }, { date: "desc" }],
      include: {
        User: { select: { id: true, firstName: true, email: true } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, firstName: true, email: true, cedula: true },
      orderBy: [{ cedula: "asc" }, { firstName: "asc" }],
    }),
    prisma.home.findMany({
      select: { id: true, title: true, price: true, priceVip: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const pendingUsd = savings
    .filter((s: any) => s.status === "PENDING" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);

  const approvedUsd = savings
    .filter((s: any) => s.status === "APPROVED" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);

  const homeTitleById = new Map<string, string>();
  const homePricingById = new Map<string, { price: number; priceVip: number }>();
  homes.forEach((home: any) => {
    homeTitleById.set(home.id, home.title || "Paquete sin título");
    homePricingById.set(home.id, {
      price: Number(home.price ?? 0),
      priceVip: Number(home.priceVip ?? 0),
    });
  });

  const packageMetaMap = new Map<string, { plan: "vip" | "estandar"; guests: number; ts: number }>();
  const packageApprovedPositiveMap = new Map<string, number>();
  const packageHasDebitMap = new Map<string, boolean>();

  for (const s of savings as any[]) {
    const details = s.paymentDetails && typeof s.paymentDetails === "object"
      ? (s.paymentDetails as Record<string, any>)
      : {};
    const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;
    if (!targetHomeId) continue;

    const key = `${s.userId}:${targetHomeId}`;
    const amountUsd = Number(s.amountUsd ?? 0);

    if (s.status === "APPROVED" && amountUsd > 0) {
      const prev = Number(packageApprovedPositiveMap.get(key) ?? 0);
      packageApprovedPositiveMap.set(key, roundMoney(prev + amountUsd));
    }

    const kind = typeof details.kind === "string" ? details.kind : null;
    if (amountUsd < 0 || kind === "CHECKOUT_DEBIT") {
      packageHasDebitMap.set(key, true);
    }

    const rawPlan = typeof details.plan === "string" ? details.plan.toLowerCase() : "";
    const plan: "vip" | "estandar" | null = rawPlan === "vip" || rawPlan === "estandar" ? rawPlan : null;
    const seatIdsInput = Array.isArray(details.seatIds)
      ? details.seatIds
      : typeof details.seatIds === "string"
      ? details.seatIds.split(",")
      : [];
    const seatIds = seatIdsInput
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    const guestsFromPayload = typeof details.guests === "number" && details.guests > 0 ? details.guests : 0;
    const guestsCount = seatIds.length > 0 ? seatIds.length : guestsFromPayload > 0 ? guestsFromPayload : 0;

    if (!plan || guestsCount <= 0) continue;

    const ts = new Date(s.createdAt ?? s.date ?? 0).getTime();
    const prevMeta = packageMetaMap.get(key);
    if (!prevMeta || ts >= prevMeta.ts) {
      packageMetaMap.set(key, { plan, guests: guestsCount, ts });
    }
  }

  const walletMap = new Map<
    string,
    {
      userId: string;
      type: "general" | "package";
      homeId: string | null;
      homeTitle: string | null;
      amountBs: number;
      amountUsd: number;
      goalUsd: number | null;
      remainingUsd: number | null;
    }
  >();

  for (const s of savings as any[]) {
    const details = s.paymentDetails && typeof s.paymentDetails === "object"
      ? (s.paymentDetails as Record<string, any>)
      : {};

    const targetHomeId = typeof details.homeId === "string" ? details.homeId : null;
    const walletType: "general" | "package" = targetHomeId ? "package" : "general";
    const key = `${s.userId}:${targetHomeId ?? "general"}`;

    const shouldCountForBalance =
      s.status === "APPROVED" || Number(s.amountUsd) < 0 || Number(s.amountBs) < 0;

    if (!shouldCountForBalance) continue;

    if (!walletMap.has(key)) {
      walletMap.set(key, {
        userId: s.userId,
        type: walletType,
        homeId: targetHomeId,
        homeTitle:
          (typeof details.homeTitle === "string" ? details.homeTitle : null) ||
          (targetHomeId ? homeTitleById.get(targetHomeId) || "Paquete sin título" : null),
        amountBs: 0,
        amountUsd: 0,
        goalUsd: null,
        remainingUsd: null,
      });
    }

    const wallet = walletMap.get(key)!;
    wallet.amountBs += Number(s.amountBs ?? 0);
    wallet.amountUsd += Number(s.amountUsd ?? 0);
  }

  const walletBalances = Array.from(walletMap.values()).map((wallet) => {
    if (wallet.type !== "package" || !wallet.homeId) return wallet;

    const key = `${wallet.userId}:${wallet.homeId}`;
    const meta = packageMetaMap.get(key);
    const pricing = homePricingById.get(wallet.homeId);
    if (!meta || !pricing) return wallet;

    const unitPrice = meta.plan === "vip" && pricing.priceVip > 0 ? pricing.priceVip : pricing.price;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return wallet;

    const goalUsd = roundMoney(unitPrice * meta.guests);
    const approvedPositiveUsd = roundMoney(Number(packageApprovedPositiveMap.get(key) ?? 0));
    const hasCheckoutDebit = packageHasDebitMap.get(key) === true;
    const remainingUsd = hasCheckoutDebit
      ? 0
      : roundMoney(Math.max(0, goalUsd - approvedPositiveUsd));

    return {
      ...wallet,
      goalUsd,
      remainingUsd,
    };
  });

  return { savings, pendingUsd, approvedUsd, users, homes, walletBalances };
}

const statusLabel: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function AdminSavingsPage() {
  const { savings, pendingUsd, approvedUsd, users, homes, walletBalances } = await getData();
  const pendingCount = savings.filter((s: any) => s.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ahorros / Alcancía</h1>
          <p className="mt-1 text-gray-600">Aprueba, rechaza o registra abonos en alcancías de usuarios registrados</p>
        </div>
        <AddSavingDialog users={users} homes={homes} walletBalances={walletBalances} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="mb-1 text-sm text-gray-500">Pendientes de revisión</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="mt-1 text-xs text-gray-400">${pendingUsd.toFixed(2)} USD</p>
        </Card>
        <Card className="p-6">
          <p className="mb-1 text-sm text-gray-500">Aprobado total (USD)</p>
          <p className="text-3xl font-bold text-green-700">${approvedUsd.toFixed(2)}</p>
        </Card>
        <Card className="p-6">
          <p className="mb-1 text-sm text-gray-500">Total de depósitos</p>
          <p className="text-3xl font-bold text-blue-700">{savings.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          {savings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No hay depósitos registrados.</div>
          ) : (
            <table className="min-w-[700px] w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Comprobante</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Bs.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {savings.map((s: any) => {
                  const details =
                    s.paymentDetails && typeof s.paymentDetails === "object"
                      ? (s.paymentDetails as Record<string, any>)
                      : {};
                  const ref = details.referenceNumber ?? "—";
                  const bank = details.emisorBank ?? "";
                  const createdByAdmin = details.createdByAdmin === true;
                  const initialAmountBs = Number(details.initialAmountBs ?? NaN);
                  const initialAmountUsd = Number(details.initialAmountUsd ?? NaN);
                  const bcvRateAtCreation = Number(details.bcvRateAtCreation ?? NaN);
                  const paymentProofUrl =
                    typeof details.paymentProofUrl === "string" ? details.paymentProofUrl : "";
                  const user = s.User;

                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                        {new Date(s.date).toLocaleDateString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {user ? (
                          <Link href={`/admin/users/${user.id}/savings`} className="text-blue-600 hover:underline">
                            <div className="font-medium">{user.firstName}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="font-mono">{ref}</div>
                        {bank && <div className="text-xs text-gray-400">{bank}</div>}
                        {createdByAdmin && (
                          <div className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                            Creada por admin
                            {Number.isFinite(initialAmountBs) && (
                              <span>
                                {" "}- Inicial Bs. {initialAmountBs.toLocaleString("es-VE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            )}
                            {Number.isFinite(initialAmountUsd) && (
                              <span> | USD ${initialAmountUsd.toFixed(2)}</span>
                            )}
                            {Number.isFinite(bcvRateAtCreation) && (
                              <span> | BCV {bcvRateAtCreation.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                        {s.status === "REJECTED" && s.rejectionReason && (
                          <div className="mt-0.5 text-xs text-red-500">Motivo: {s.rejectionReason}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {paymentProofUrl ? (
                          <a
                            href={paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Ver captura
                          </a>
                        ) : (
                          <span className="text-gray-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-900">
                        Bs. {Number(s.amountBs).toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-green-700">
                        ${Number(s.amountUsd).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyle[s.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {statusLabel[s.status] ?? s.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <SavingActions savingId={s.id} currentStatus={s.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}



