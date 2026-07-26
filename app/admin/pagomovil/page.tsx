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
          <h1 className="text-3xl font-bold text-foreground">Pago Móvil R4</h1>
          <p className="text-muted-foreground mt-1">
            Notificaciones recibidas del banco
          </p>
        </div>
        <Link
          href="/admin/pagomovil/json-logs"
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Ver logs JSON →
        </Link>
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
                  Referencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Banco emisor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Teléfono emisor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Código red
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                  Abonado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Payment ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notificaciones.map((n: any) => (
                <tr key={n.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                    {new Date(n.createdAt).toLocaleString("es-VE")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                    {n.referencia}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {n.bancoEmisor}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {n.telefonoEmisor}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground text-right">
                    {n.monto?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {n.codigoRed}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {n.abonado ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                    {n.paymentId || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {notificaciones.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay notificaciones registradas</p>
          </div>
        )}
      </Card>
    </div>
  );
}
