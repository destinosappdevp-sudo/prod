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
        <h1 className="text-3xl font-bold text-foreground">Retiros de hosts</h1>
        <p className="text-muted-foreground mt-1">
          Procesa solicitudes de retiro pendientes
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="min-w-[900px] w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Host
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Método
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Banco
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map((w: any) => {
                const details = getDetails(w.paymentDetails);
                const currency = details.currency === "VES" ? "VES" : "USD";
                const prefix = currency === "VES" ? "Bs " : "$";
                return (
                  <tr key={w.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                      {new Date(w.createdAt).toLocaleString("es-VE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-foreground">
                        {w.User?.firstName || "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {w.User?.email || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {String(w.paymentMethod || "").replace(/_/g, " ")} (
                      {currency})
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground text-right">
                      {prefix}
                      {Number(w.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {String(details.bankName || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      {String(details.cedula || "—")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
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
            <p className="text-muted-foreground">No hay retiros pendientes</p>
          </div>
        )}
      </Card>
    </div>
  );
}
