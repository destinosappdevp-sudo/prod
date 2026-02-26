import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { DollarSign, Calendar, TrendingUp, CreditCard } from "lucide-react";

async function getPaymentsData() {
  const reservations = await prisma.reservation.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return reservations;
}

export default async function PaymentsPage() {
  const reservations = await getPaymentsData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos & Reservas</h1>
          <p className="text-gray-600 mt-1">Gestiona transacciones y reservas</p>
        </div>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" disabled>
          Exportar Reporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-xs text-gray-500 mt-1">Próximamente</p>
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
              <p className="text-2xl font-bold">{reservations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Comisión Plataforma</p>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-xs text-gray-500 mt-1">Próximamente</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <CreditCard className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pagos Procesados</p>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-500 mt-1">Próximamente</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Reservations Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Reservas Recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Reserva
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Salida
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio/Noche
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500">
                      {reservation.id.substring(0, 8)}...
                    </span>
                  </td>
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
                    <span className="text-sm text-gray-900">
                      {new Date(reservation.startDate).toLocaleDateString("es-ES")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(reservation.endDate).toLocaleDateString("es-ES")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold">
                      {reservation.Home?.price ? `$${reservation.Home.price}` : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Confirmada
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                      Ver
                    </button>
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
