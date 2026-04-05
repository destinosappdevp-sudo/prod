import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

const prismaAny = prisma as any;

interface Saving {
  id: string;
  date: Date;
  bcvRate: number;
  amountBs: number;
  amountUsd: number;
  createdAt: Date;
}

async function getData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true },
  });

  if (!user) return null;

  const savings: Saving[] = await prismaAny.saving.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const totalUsd = savings.reduce((sum, s) => sum + s.amountUsd, 0);
  const totalBs = savings.reduce((sum, s) => sum + s.amountBs, 0);

  return { user, savings, totalUsd, totalBs };
}

export default async function UserSavingsPage({
  params,
}: {
  params: { userId: string };
}) {
  const data = await getData(params.userId);

  if (!data) notFound();

  const { user, savings, totalUsd, totalBs } = data;

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
          Ahorros de {user.firstName} {user.lastName}
        </h1>
        <p className="text-gray-600 mt-1">{user.email}</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Total acumulado (USD)</p>
          <p className="text-3xl font-bold text-green-700">
            ${totalUsd.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {savings.length} depósito{savings.length !== 1 ? "s" : ""}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500 mb-1">Total acumulado (Bs.)</p>
          <p className="text-3xl font-bold text-blue-700">
            Bs. {totalBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </Card>
      </div>

      {/* Tabla de detalle */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {savings.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Este usuario no tiene ahorros registrados.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa BCV
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Bs.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto USD
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savings.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-gray-500">
                        {s.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(s.date).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                      {s.bcvRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      Bs.{" "}
                      {s.amountBs.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700 text-right">
                      ${s.amountUsd.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700">
                    Total
                  </td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-700">
                    ${totalUsd.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
