import { unstable_noStore } from "next/cache";
import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import WithdrawalActions from "./WithdrawalActions";

async function getPendingWithdrawals() {
  unstable_noStore();
  const prismaAny = prisma as any;
  const withdrawals = await prismaAny.withdrawalRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      User: {
        select: { id: true, firstName: true, email: true },
      },
    },
  });
  return withdrawals;
}

function getDetails(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export default async function WithdrawalsPage() {
  const withdrawals = await getPendingWithdrawals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Retiros de hosts</h1>
        <p className="text-gray-600 mt-1">
          Procesa solicitudes de retiro pendientes
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="min-w-[900px] w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Host
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Método
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Banco
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {withdrawals.map((w: any) => {
                const details = getDetails(w.paymentDetails);
                const currency = details.currency === "VES" ? "VES" : "USD";
                const prefix = currency === "VES" ? "Bs " : "$";
                return (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(w.createdAt).toLocaleString("es-VE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {w.User?.firstName || "—"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {w.User?.email || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {String(w.paymentMethod || "").replace(/_/g, " ")} (
                      {currency})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {prefix}
                      {Number(w.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {String(details.bankName || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {String(details.cedula || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {String(details.phoneNumber || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <WithdrawalActions withdrawalId={w.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {withdrawals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay retiros pendientes</p>
          </div>
        )}
      </Card>
    </div>
  );
}
