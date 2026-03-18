import { unstable_noStore } from 'next/cache';
import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { DollarSign, Calendar, CreditCard, AlertCircle } from "lucide-react";
import PaymentsClient from "./PaymentsClient";

async function getPaymentsData() {
  unstable_noStore();
  const prismaAny = prisma as any;
  
  const reservations = await prismaAny.reservation.findMany({
    select: {
      id: true,
      homeId: true,
      userId: true,
      startDate: true,
      endDate: true,
      nights: true,
      status: true,
      totalAmount: true,
      createdAt: true,
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
      Payment: {
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          referenceNumber: true,
          amount: true,
          paymentDetails: true,
          confirmedAt: true,
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

async function getStats() {
  unstable_noStore();
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
      <PaymentsClient reservations={reservations} />
    </div>
  );
}
