import prisma from "@/app/lib/db";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import SavingActions from "../users/[userId]/savings/SavingActions";
import { unstable_noStore } from "next/cache";

const prismaAny = prisma as any;

async function getData() {
  unstable_noStore();
  const savings = await prismaAny.saving.findMany({
    orderBy: [{ status: "asc" }, { date: "desc" }],
    include: {
      User: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  const pendingUsd = savings
    .filter((s: any) => s.status === "PENDING" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);
  const approvedUsd = savings
    .filter((s: any) => s.status === "APPROVED" && Number(s.amountUsd) >= 0)
    .reduce((sum: number, s: any) => sum + Number(s.amountUsd), 0);
  return { savings, pendingUsd, approvedUsd };
}

const statusLabel: Record<string, string> = { PENDING: "En revisión", APPROVED: "Aprobado", REJECTED: "Rechazado" };
const statusStyle: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function AdminSavingsPage() {
  const { savings, pendingUsd, approvedUsd } = await getData();
  const pendingCount = savings.filter((s: any) => s.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ahorros / Alcancía</h1>
        <p className="text-gray-600 mt-1">Aprueba o rechaza depósitos a la alcancía de los usuarios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Pendientes de revisión</p>
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-1">${pendingUsd.toFixed(2)} USD</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Aprobado total (USD)</p>
          <p className="text-3xl font-bold text-green-700">${approvedUsd.toFixed(2)}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Total de depósitos</p>
          <p className="text-3xl font-bold text-blue-700">{savings.length}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {savings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">No hay depósitos registrados.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bs.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">USD</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savings.map((s: any) => {
                  const details = s.paymentDetails && typeof s.paymentDetails === "object" ? s.paymentDetails as Record<string, any> : {};
                  const ref = details.referenceNumber ?? "—";
                  const bank = details.emisorBank ?? "";
                  const paymentProofUrl = typeof details.paymentProofUrl === "string" ? details.paymentProofUrl : "";
                  const u = s.User;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(s.date).toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {u ? (
                          <Link href={`/admin/users/${u.id}/savings`} className="text-blue-600 hover:underline">
                            <div className="font-medium">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </Link>
                        ) : "—"}
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
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        Bs. {Number(s.amountBs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-green-700 text-right">${Number(s.amountUsd).toFixed(2)}</td>
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
