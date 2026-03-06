"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Lógica para obtener pagos pendientes usando Supabase
async function getPendingPayments() {
  const { data, error } = await supabase
    .from("Payment")
    .select("*, Reservation(*, User(*), Home(*))")
    .eq("status", "PENDING");
  if (error) return { success: false, payments: [] };
  return { success: true, payments: data };
}

export default function PendingApprovalsClient() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [historyPayments, setHistoryPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const loadAllHomesAndPayments = async () => {
    try {
      setLoading(true);
      const pendingPaymentsResult = await getPendingPayments();
      const historyPaymentsResult = await getHistoryPayments();
      if (pendingPaymentsResult.success) {
        setPendingPayments(pendingPaymentsResult.payments);
      }
      if (historyPaymentsResult.success) {
        setHistoryPayments(historyPaymentsResult.payments);
      }
    } catch (error) {
      console.error("Error cargando pagos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllHomesAndPayments();
  }, [loadAllHomesAndPayments]);

<<<<<<< HEAD
  const handlePaymentAction = async (paymentId: string, action: "confirm" | "reject") => {
    if (!confirm(`¿Estás seguro de que deseas ${action === "confirm" ? "aprobar" : "rechazar"} este pago?`)) {
      return;
=======
  const loadAllHomes = async () => {
    try {
      setLoading(true);
      const [pendingResult, approvedResult] = await Promise.all([
        fetch("/api/admin/approvals/pending").then(res => res.json()),
        fetch("/api/admin/approvals/approved").then(res => res.json()),
      ]);

      if (pendingResult.success) {
        setPendingHomes(pendingResult.homes);
      }
      if (approvedResult.success) {
        setApprovedHomes(approvedResult.homes);
      }
    } catch (error) {
      console.error("Error cargando alojamientos:", error);
    } finally {
      setLoading(false);
>>>>>>> 4fe2ff8 (feat: endpoints de reportes y dashboard super admin con gráficos)
    }
    try {
      setLoading(true);
<<<<<<< HEAD
      // Llamar a la función server action para actualizar el estado
      const { updatePaymentStatus } = await import("@/app/actions/home");
      const result = await updatePaymentStatus(paymentId, action);
      if (result.success) {
        await loadAllHomesAndPayments();
      } else {
        alert(result.error || "Error al procesar la acción");
=======
      const result = await fetch("/api/admin/approvals/pending").then(res => res.json());
      if (result.success) {
        setPendingHomes(result.homes);
>>>>>>> 4fe2ff8 (feat: endpoints de reportes y dashboard super admin con gráficos)
      }
    } catch (error) {
      alert("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // Nueva función para traer historial
  async function getHistoryPayments(limit = 50, offset = 0) {
    const res = await fetch('/api/admin/payments/history', {
      method: 'GET',
    });
    if (!res.ok) return { success: false, payments: [] };
    const data = await res.json();
    return { success: true, payments: data.payments };
  }
=======
  const handleApprove = async (homeId: string) => {
    try {
      setIsApproving(true);
      const res = await fetch(`/api/admin/approvals/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId }),
      });
      const result = await res.json();
      if (!result.success) alert("Error al aprobar el alojamiento");
      await loadAllHomes();
    } catch (error) {
      console.error("Error aprobando alojamiento:", error);
      alert("Error al aprobar el alojamiento");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHome) return;
    try {
      setIsRejecting(true);
      const res = await fetch(`/api/admin/approvals/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId: selectedHome.id, reason: rejectionReason }),
      });
      const result = await res.json();
      if (!result.success) alert("Error al rechazar el alojamiento");
      setPendingHomes(pendingHomes.filter((h) => h.id !== selectedHome.id));
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedHome(null);
    } catch (error) {
      console.error("Error rechazando alojamiento:", error);
      alert("Error al rechazar el alojamiento");
    } finally {
      setIsRejecting(false);
    }
  };
>>>>>>> 4fe2ff8 (feat: endpoints de reportes y dashboard super admin con gráficos)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando pagos pendientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'pending'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'history'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Historial
        </button>
      </div>
      {activeTab === 'pending' && (
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagos pendientes de reservas</h2>
          <Button variant="outline" onClick={loadAllHomesAndPayments}>
            Actualizar
          </Button>
          {pendingPayments.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">¡Todo aprobado!</h3>
              <p className="text-gray-600">
                No hay pagos pendientes de reservas
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingPayments.map((payment) => (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">Reserva pendiente</h3>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Pago pendiente
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Usuario</p>
                          <p className="font-medium">
                            {payment.Reservation?.User?.firstName} {payment.Reservation?.User?.lastName}
                          </p>
                          <p className="text-gray-600">{payment.Reservation?.User?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Propiedad</p>
                          <p className="font-medium">
                            {payment.Reservation?.Home?.title}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Monto: ${(payment.subtotal + payment.serviceFee).toFixed(2)} {/* Monto total pagado: subtotal + comisión */}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Método: {payment.paymentMethod}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Referencia: {payment.referenceNumber}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Creado: {" "}
                        {new Date(payment.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handlePaymentAction(payment.id, "confirm")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handlePaymentAction(payment.id, "reject")}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Historial de pagos</h2>
          {historyPayments.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
              <p className="text-gray-600">No hay pagos aprobados o rechazados.</p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {historyPayments.map((payment) => (
                <Card key={payment.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{payment.status === 'CONFIRMED' ? 'Pago aprobado' : 'Pago rechazado'}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${payment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {payment.status === 'CONFIRMED' ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Usuario</p>
                          <p className="font-medium">
                            {payment.Reservation?.User?.firstName} {payment.Reservation?.User?.lastName}
                          </p>
                          <p className="text-gray-600">{payment.Reservation?.User?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Propiedad</p>
                          <p className="font-medium">
                            {payment.Reservation?.Home?.title}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Monto: ${payment.amount}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Método: {payment.paymentMethod}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Referencia: {payment.referenceNumber}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Creado: {new Date(payment.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
