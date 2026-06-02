import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import SavingActions from "./SavingActions";
import { unstable_noStore } from "next/cache";

const prismaAny = prisma as any;

interface Saving {
  id: string;
  date: Date;
  bcvRate: number;
  amountBs: number;
  amountUsd: number;
  createdAt: Date;
  status: string;
  rejectionReason?: string | null;
  paymentDetails?: any;
}

interface WalletSummary {
  key: string;
  targetType: "general" | "package";
  targetId: string | null;
  title: string;
  amountUsd: number;
  amountBs: number;
  movementCount: number;
}

async function getData(userId: string) {
  unstable_noStore();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, email: true },
  });

  if (!user) return null;

  const savings: Saving[] = await prismaAny.saving.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  // Excluir explícitamente los abonos rechazados de todos los cálculos
  const validSavings = savings.filter((s) => s.status !== "REJECTED");

  const approvedUsd = validSavings
    .filter((s) => s.status === "APPROVED" || Number(s.amountUsd) < 0)
    .reduce((sum, s) => sum + s.amountUsd, 0);
  const totalDepositedApprovedUsd = validSavings
    .filter((s) => s.status === "APPROVED" && Number(s.amountUsd) > 0)
    .reduce((sum, s) => sum + s.amountUsd, 0);
  const totalBs = validSavings
    .filter((s) => s.status === "APPROVED" || Number(s.amountBs) < 0)
    .reduce((sum, s) => sum + s.amountBs, 0);
  const pendingUsd = validSavings
    .filter((s) => s.status === "PENDING" && Number(s.amountUsd) >= 0)
    .reduce((sum, s) => sum + s.amountUsd, 0);
  const totalSavingsUsd = validSavings
    .filter((s) => Number(s.amountUsd) > 0 && s.status === "APPROVED")
    .reduce((sum, s) => sum + s.amountUsd, 0);

  const referenceRate =
    savings.find((s) => Number(s.bcvRate) > 0)?.bcvRate ?? 0;

  const packageIds = new Set<string>();
  const packageTitlesById = new Map<string, string>();

  for (const s of validSavings) {
    const details =
      s.paymentDetails && typeof s.paymentDetails === "object"
        ? (s.paymentDetails as Record<string, any>)
        : {};
    const homeId = typeof details.homeId === "string" ? details.homeId : null;
    const homeTitle =
      typeof details.homeTitle === "string" && details.homeTitle.trim().length > 0
        ? details.homeTitle.trim()
        : null;

    if (homeId) {
      packageIds.add(homeId);
      if (homeTitle) packageTitlesById.set(homeId, homeTitle);
    }
  }

  if (packageIds.size > 0) {
    const homes = await prisma.home.findMany({
      where: { id: { in: Array.from(packageIds) } },
      select: { id: true, title: true },
    });
    for (const home of homes) {
      if (home.title) packageTitlesById.set(home.id, home.title);
    }
  }

  const walletsMap = new Map<string, WalletSummary>();

  const ensureWallet = (targetId: string | null, fallbackTitle?: string | null) => {
    const key = targetId ?? "general";
    const current = walletsMap.get(key);
    if (current) return current;

    const title = targetId
      ? packageTitlesById.get(targetId) || fallbackTitle || "Paquete"
      : "Alcancía general";

    const created: WalletSummary = {
      key,
      targetType: targetId ? "package" : "general",
      targetId,
      title,
      amountUsd: 0,
      amountBs: 0,
      movementCount: 0,
    };
    walletsMap.set(key, created);
    return created;
  };

  for (const s of savings) {
    const details =
      s.paymentDetails && typeof s.paymentDetails === "object"
        ? (s.paymentDetails as Record<string, any>)
        : {};
    const targetId = typeof details.homeId === "string" ? details.homeId : null;
    const wallet = ensureWallet(
      targetId,
      typeof details.homeTitle === "string" ? details.homeTitle : null
    );

    const isApproved = s.status === "APPROVED";
    const isNegative = Number(s.amountUsd) < 0;

    // Monto ahorrado actual: neto aprobado (incluye descuentos negativos).
    if (isApproved || isNegative) {
      wallet.amountUsd += Number(s.amountUsd);
      wallet.amountBs += Number(s.amountBs);
    }
    // movementCount solo para abonos no rechazados (estamos iterando validSavings)
    wallet.movementCount += 1;
  }

  const walletSummaries = Array.from(walletsMap.values()).sort((a, b) => {
    if (a.targetType === "general") return -1;
    if (b.targetType === "general") return 1;
    return b.amountUsd - a.amountUsd;
  });

  return {
    user,
    savings,
    approvedUsd,
    totalDepositedApprovedUsd,
    totalBs,
    pendingUsd,
    totalSavingsUsd,
    referenceRate,
    walletSummaries,
  };
}

const statusLabel: Record<string, string> = { PENDING: "En revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" };
const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function UserSavingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await params;
  const { tab } = await searchParams;
  const data = await getData(userId);

  if (!data) notFound();

  const {
    user,
    savings,
    approvedUsd,
    totalDepositedApprovedUsd,
    totalBs,
    pendingUsd,
    totalSavingsUsd,
    referenceRate,
    walletSummaries,
  } = data;

  const activeTab = tab === "detalle" ? "detalle" : "historial";
  const walletsWithBalance = walletSummaries.filter((wallet) => wallet.amountUsd > 0);
  const approvedBsFromRate = approvedUsd * referenceRate;
  const pendingBsFromRate = pendingUsd * referenceRate;
  const totalSavingsBsFromRate = totalSavingsUsd * referenceRate;
  const usedOrRedeemedUsd = Math.max(0, totalDepositedApprovedUsd - approvedUsd);
  const usedOrRedeemedBsFromRate = usedOrRedeemedUsd * referenceRate;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={14} />
          Volver a Usuarios
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Ahorros de {user.firstName}
        </h1>
        <p className="text-gray-600 mt-1">{user.email}</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Ahorros (USD)</p>
          <p className="text-3xl font-bold text-emerald-700">${totalSavingsUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {referenceRate > 0
              ? `Bs. ${totalSavingsBsFromRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Tasa no disponible"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Saldo disponible</p>
          <p className="text-3xl font-bold text-green-700">${approvedUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {referenceRate > 0
              ? `Bs. ${approvedBsFromRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Tasa no disponible"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Pendiente de revisión (USD)</p>
          <p className="text-3xl font-bold text-yellow-600">${pendingUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {referenceRate > 0
              ? `Bs. ${pendingBsFromRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Tasa no disponible"}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Saldo usado o canjeado</p>
          <p className="text-3xl font-bold text-slate-800">${usedOrRedeemedUsd.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {referenceRate > 0
              ? `Bs. ${usedOrRedeemedBsFromRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "Tasa no disponible"}
          </p>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <Link
                href={`/admin/users/${userId}/savings?tab=historial`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "historial"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Historial de depósitos
              </Link>
              <Link
                href={`/admin/users/${userId}/savings?tab=detalle`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "detalle"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Detalle de ahorros
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Tasa BCV usada: {referenceRate > 0
                ? referenceRate.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "No disponible"}
            </p>
          </div>
        </div>
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {activeTab === "historial" && savings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Este usuario no tiene ahorros registrados.</div>
          ) : activeTab === "detalle" ? (
            <div className="p-6">
              {walletsWithBalance.length === 0 ? (
                <div className="p-10 text-center text-gray-500">Este usuario no tiene alcancías con movimientos.</div>
              ) : (
                <div className="w-full max-w-full overflow-x-auto overscroll-x-contain touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0 rounded-xl border border-gray-200">
                  <table className="min-w-[700px] w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alcancía</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto (USD)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Equivalente (Bs.)</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Movimientos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {walletsWithBalance.map((wallet) => (
                        <tr key={wallet.key} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900">{wallet.title}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {wallet.targetType === "general" ? "General" : "Paquete"}
                          </td>
                          <td className="px-4 py-4 text-sm text-right font-semibold text-emerald-700">
                            ${wallet.amountUsd.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-gray-700">
                            Bs. {wallet.amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-4 text-sm text-right text-gray-600">
                            {wallet.movementCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            ) : (
            <table className="min-w-[700px] w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tasa BCV</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Bs.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savings.map((s) => {
                  const details = s.paymentDetails && typeof s.paymentDetails === "object" ? s.paymentDetails as Record<string, any> : {};
                  const ref = details.referenceNumber ?? "—";
                  const bank = details.emisorBank ?? "";
                  const paymentProofUrl = typeof details.paymentProofUrl === "string" ? details.paymentProofUrl : "";
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(s.date).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <div className="font-mono">{ref}</div>
                        {bank && <div className="text-xs text-gray-400">{bank}</div>}
                        {s.status === "REJECTED" && s.rejectionReason && (
                          <div className="text-xs text-red-500 mt-0.5">Motivo: {s.rejectionReason}</div>
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
                      <td className="px-4 py-4 text-sm text-gray-700 text-right font-mono">{s.bcvRate.toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        Bs. {s.amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-green-700 text-right">${s.amountUsd.toFixed(2)}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[s.status] ?? "bg-gray-100 text-gray-600"}`}>
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
