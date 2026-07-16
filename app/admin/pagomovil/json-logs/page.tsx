import { unstable_noStore } from "next/cache";
import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import Link from "next/link";

async function getLogs() {
  unstable_noStore();
  const prismaAny = prisma as any;
  const logs = await prismaAny.r4JsonLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return logs;
}

export default async function JsonLogsPage() {
  const logs = await getLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs JSON R4</h1>
          <p className="text-gray-600 mt-1">
            Payloads recibidos de R4consulta y R4notifica
          </p>
        </div>
        <Link
          href="/admin/pagomovil"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Volver a notificaciones
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
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Respuesta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.createdAt).toLocaleString("es-VE")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${log.tipo === "CONSULTA" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                    >
                      {log.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                    {log.clientIp || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {log.respuesta || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <pre className="max-w-md overflow-auto text-xs bg-gray-50 p-2 rounded">
                      {log.rawPayload}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay logs registrados</p>
          </div>
        )}
      </Card>
    </div>
  );
}
