import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { DollarSign, Calendar, TrendingUp, CreditCard, AlertCircle } from "lucide-react";
import PaymentActions from "./PaymentActions";

async function getPaymentsData() {
  const prismaAny = prisma as any;
  
  const reservations = await prismaAny.reservation.findMany({
    include: {
      User: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      Home: {
        select: {
          title: true,
          price: true,
        },
      },
      Payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return reservations;
}

async function getStats() {
  const prismaAny = prisma as any;
  
  const [
    totalReservations,
    pendingPayments,
    confirmedPayments,
    totalRevenue
  ] = await Promise.all([
    prismaAny.reservation.count(),
    prismaAny.payment.count({ where: { status: "PENDING" } }),
    prismaAny.payment.count({ where: { status: "CONFIRMED" } }),
    prismaAny.payment.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalReservations,
    pendingPayments,
    confirmedPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
}

export default async function PaymentsPage() {
  const reservations = await getPaymentsData();
  const stats = await getStats();

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      PAGO_MOVIL: "Pago Móvil",
      ZELLE: "Zelle",
      ZILLI: "Zilli",
      TARJETA_INTERNACIONAL: "Tarjeta Internacional",
      TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
    };
    return methods[method] || method;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
      CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-700" },
      CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-700" },
      COMPLETED: { label: "Completado", color: "bg-blue-100 text-blue-700" },
    };
    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos & Reservas</h1>
          <p className="text-gray-600 mt-1">Gestiona transacciones y reservas</p>
        </div>
      </div>

      {stats.pendingPayments > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Tienes <span className="font-bold">{stats.pendingPayments}</span> pago(s) pendiente(s) de confirmación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Confirmados</p>
              <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reservas Totales</p>
              <p className="text-2xl font-bold">{stats.totalReservations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagos Pendientes</p>
              <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagos Confirmados</p>
              <p className="text-2xl font-bold">{stats.confirmedPayments}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Reservas y Pagos Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fechas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Noches
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Pago
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado Reserva
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation: any) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.User?.firstName} {reservation.User?.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{reservation.User?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reservation.Home?.title || "Sin título"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(reservation.startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(reservation.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium">{reservation.nights || "-"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold">
                      {reservation.totalAmount ? `$${reservation.totalAmount.toFixed(2)}` : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {reservation.Payment
                        ? getPaymentMethodLabel(reservation.Payment.paymentMethod)
                        : "N/A"}
                    </div>
                    {reservation.Payment?.referenceNumber && (
                      <div className="text-xs text-gray-500">
                        Ref: {reservation.Payment.referenceNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {reservation.Payment ? getStatusBadge(reservation.Payment.status) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {reservation.Payment && reservation.Payment.status === "PENDING" && (
                      <PaymentActions 
                        paymentId={reservation.Payment.id}
                        reservationId={reservation.id}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {reservations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay reservas registradas</p>
        </div>
      )}
    </div>
  );
}
