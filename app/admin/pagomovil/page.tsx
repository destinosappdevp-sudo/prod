import { unstable_noStore } from "next/cache";
import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import Link from "next/link";

async function getNotificaciones() {
  unstable_noStore();
  const prismaAny = prisma as any;
  const notificaciones = await prismaAny.pagoMovilNotificacion.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return notificaciones;
}

export default async function PagomovilPage() {
  const notificaciones = await getNotificaciones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pago Móvil R4</h1>
          <p className="text-gray-600 mt-1">
            Notificaciones recibidas del banco
          </p>
        </div>
        <Link
          href="/admin/pagomovil/json-logs"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver logs JSON →
        </Link>
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
                  Referencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Banco emisor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Teléfono emisor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código red
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Abonado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notificaciones.map((n: any) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(n.createdAt).toLocaleString("es-VE")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {n.referencia}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {n.bancoEmisor}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {n.telefonoEmisor}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {n.monto?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {n.codigoRed}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {n.abonado ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                    {n.paymentId || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notificaciones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay notificaciones registradas</p>
          </div>
        )}
      </Card>
    </div>
  );
}
