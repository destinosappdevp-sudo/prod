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
          <h1 className="text-3xl font-bold text-foreground">Logs JSON R4</h1>
          <p className="text-muted-foreground mt-1">
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
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Respuesta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {new Date(log.createdAt).toLocaleString("es-VE")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${log.tipo === "CONSULTA" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                    >
                      {log.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground font-mono">
                    {log.clientIp || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {log.respuesta || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    <pre className="max-w-md overflow-auto text-xs bg-muted/50 p-2 rounded">
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
            <p className="text-muted-foreground">No hay logs registrados</p>
          </div>
        )}
      </Card>
    </div>
  );
}
