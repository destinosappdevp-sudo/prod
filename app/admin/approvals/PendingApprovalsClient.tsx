"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  approveHome,
  rejectHome,
  getPendingHomes,
  getApprovedHomes,
} from "@/app/actions/home";

interface PendingHome {
  id: string;
  title: string;
  description: string;
  country: string;
  municipality: string | null;
  price: number;
  categoryName: string | null;
  createdAt: string;
  approvedAt?: string | null;
  // Campos de pago
  paymentReference?: string | null;
  paymentBank?: string | null;
  paymentMethod?: string | null;
  paymentAmount?: number | null;
  paymentDate?: string | null;
  User: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    isVerified: boolean;
  };
}

export default function PendingApprovalsClient() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [pendingHomes, setPendingHomes] = useState<PendingHome[]>([]);
  const [approvedHomes, setApprovedHomes] = useState<PendingHome[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHome, setSelectedHome] = useState<PendingHome | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadAllHomes();
  }, []);

  const loadAllHomes = async () => {
    try {
      setLoading(true);
      const [pendingResult, approvedResult] = await Promise.all([
        getPendingHomes(),
        getApprovedHomes(),
      ]);

      if (pendingResult.success) {
        const normalizedPendingHomes = pendingResult.homes
          .filter((home: any) => !!home.User)
          .map((home: any) => ({
            id: home.id,
            title: home.title || "Sin título",
            description: home.description || "",
            country: home.country || "",
            municipality: home.municipality,
            price: home.price || 0,
            categoryName: home.categoryName,
            createdAt: home.createdAt,
            User: {
              id: home.User.id,
              email: home.User.email,
              firstName: home.User.firstName,
              lastName: home.User.lastName,
              isVerified: home.User.isVerified,
            },
          }));

        setPendingHomes(normalizedPendingHomes);
      }

      if (approvedResult.success) {
        const normalizedApprovedHomes = approvedResult.homes
          .filter((home: any) => !!home.User)
          .map((home: any) => ({
            id: home.id,
            title: home.title || "Sin título",
            description: home.description || "",
            country: home.country || "",
            municipality: home.municipality,
            price: home.price || 0,
            categoryName: home.categoryName,
            createdAt: home.createdAt,
            approvedAt: home.approvedAt,
            // Campos de pago
            paymentReference: home.paymentReference,
            paymentBank: home.paymentBank,
            paymentMethod: home.paymentMethod,
            paymentAmount: home.paymentAmount,
            paymentDate: home.paymentDate,
            User: {
              id: home.User.id,
              email: home.User.email,
              firstName: home.User.firstName,
              lastName: home.User.lastName,
              isVerified: home.User.isVerified,
            },
          }));

        setApprovedHomes(normalizedApprovedHomes);
      }
    } catch (error) {
      console.error("Error cargando alojamientos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingHomes = async () => {
    try {
      setLoading(true);
      const result = await getPendingHomes();
      if (result.success) {
        const normalizedHomes = result.homes
          .filter((home: any) => !!home.User)
          .map((home: any) => ({
            id: home.id,
            title: home.title || "Sin título",
            description: home.description || "",
            country: home.country || "",
            municipality: home.municipality,
            price: home.price || 0,
            categoryName: home.categoryName,
            createdAt: home.createdAt,
            User: {
              id: home.User.id,
              email: home.User.email,
              firstName: home.User.firstName,
              lastName: home.User.lastName,
              isVerified: home.User.isVerified,
            },
          }));

        setPendingHomes(normalizedHomes);
      }
    } catch (error) {
      console.error("Error cargando alojamientos pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (homeId: string) => {
    try {
      setIsApproving(true);
      await approveHome(homeId);
      // Refrescar ambas listas después de aprobar
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
      await rejectHome(selectedHome.id, rejectionReason);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando alojamientos...</span>
      </div>
    );
  }

  const currentHomes = activeTab === "pending" ? pendingHomes : approvedHomes;
  const currentCount = currentHomes.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Gestión de Alojamientos
          </h2>
          <p className="text-gray-600 mt-1">
            {activeTab === "pending" 
              ? `${pendingHomes.length} pendiente${pendingHomes.length !== 1 ? "s" : ""}`
              : `${approvedHomes.length} aprobado${approvedHomes.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <Button variant="outline" onClick={loadAllHomes}>
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "pending"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Pendientes
          {pendingHomes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
              {pendingHomes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "approved"
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Aprobadas
          {approvedHomes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
              {approvedHomes.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending Homes */}
      {activeTab === "pending" && (
        <>
          {pendingHomes.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">¡Todo aprobado!</h3>
          <p className="text-gray-600">
            No hay alojamientos pendientes de aprobación
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingHomes.map((home) => (
            <Card key={home.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{home.title}</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      Pendiente
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {home.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Anfitrión</p>
                      <p className="font-medium">
                        {home.User.firstName} {home.User.lastName}
                      </p>
                      <p className="text-gray-600">{home.User.email}</p>
                      {home.User.isVerified ? (
                        <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          ✓ Verificado
                        </span>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          ✗ No verificado
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-gray-600">Ubicación</p>
                      <p className="font-medium">
                        {home.municipality || home.country}
                      </p>
                      <p className="text-gray-600">
                        Categoría: {home.categoryName || "N/A"}
                      </p>
                      <p className="text-gray-600 mt-2">
                        Precio: ${home.price}/noche
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Creado:{" "}
                    {new Date(home.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => handleApprove(home.id)}
                    disabled={isApproving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aprobando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      setSelectedHome(home);
                      setShowRejectDialog(true);
                    }}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      {/* Approved Homes */}
      {activeTab === "approved" && (
        <>
          {approvedHomes.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sin alojamientos aprobados</h3>
              <p className="text-gray-600">
                Aún no hay alojamientos que hayan sido aprobados
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {approvedHomes.map((home) => (
                <Card key={home.id} className="p-6 border-l-4 border-green-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{home.title}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Aprobado
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {home.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-600">Anfitrión</p>
                          <p className="font-medium">
                            {home.User.firstName} {home.User.lastName}
                          </p>
                          <p className="text-gray-600">{home.User.email}</p>
                          {home.User.isVerified ? (
                            <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              ✓ Verificado
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              ✗ No verificado
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-gray-600">Ubicación</p>
                          <p className="font-medium">
                            {home.municipality || home.country}
                          </p>
                          <p className="text-gray-600">
                            Categoría: {home.categoryName || "N/A"}
                          </p>
                          <p className="text-gray-600 mt-2">
                            Precio: ${home.price}/noche
                          </p>
                        </div>
                      </div>

                      {/* Información de Pago */}
                      {(home.paymentReference || home.paymentBank || home.paymentMethod) && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <p className="text-xs font-semibold text-blue-900 mb-2 uppercase">
                            Información de Pago
                          </p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {home.paymentMethod && (
                              <div>
                                <p className="text-blue-700 text-xs">Método</p>
                                <p className="font-medium text-blue-900">
                                  {home.paymentMethod === "PAGO_MOVIL" ? "Pago Móvil" :
                                   home.paymentMethod === "TRANSFERENCIA_BANCARIA" ? "Transferencia" :
                                   home.paymentMethod === "ZELLE" ? "Zelle" :
                                   home.paymentMethod === "ZILLI" ? "Zinli" :
                                   home.paymentMethod === "TARJETA_INTERNACIONAL" ? "Tarjeta Int." :
                                   home.paymentMethod}
                                </p>
                              </div>
                            )}
                            {home.paymentBank && (
                              <div>
                                <p className="text-blue-700 text-xs">Banco</p>
                                <p className="font-medium text-blue-900">{home.paymentBank}</p>
                              </div>
                            )}
                            {home.paymentReference && (
                              <div>
                                <p className="text-blue-700 text-xs">Referencia</p>
                                <p className="font-medium text-blue-900">{home.paymentReference}</p>
                              </div>
                            )}
                            {home.paymentAmount && (
                              <div>
                                <p className="text-blue-700 text-xs">Monto</p>
                                <p className="font-medium text-blue-900">
                                  ${home.paymentAmount.toFixed(2)}
                                </p>
                              </div>
                            )}
                            {home.paymentDate && (
                              <div className="col-span-2">
                                <p className="text-blue-700 text-xs">Fecha de pago</p>
                                <p className="font-medium text-blue-900">
                                  {new Date(home.paymentDate).toLocaleDateString("es-ES", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Creado:{" "}
                          {new Date(home.createdAt).toLocaleDateString("es-ES")}
                        </p>
                        {home.approvedAt && (
                          <p className="text-xs text-green-600 font-medium">
                            Aprobado:{" "}
                            {new Date(home.approvedAt).toLocaleDateString("es-ES")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => {
                          setSelectedHome(home);
                          setShowRejectDialog(true);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Revocar
                      </Button>

                      <Button
                        onClick={() => handleApprove(home.id)}
                        disabled={isApproving}
                        variant="outline"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mantener
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Alojamiento</DialogTitle>
            <DialogDescription>
              Proporciona una razón para rechazar este alojamiento. El anfitrión
              será notificado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedHome && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">{selectedHome.title}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Por: {selectedHome.User.firstName} {selectedHome.User.lastName}
                </p>
              </div>
            )}

            <Textarea
              placeholder="Razón del rechazo..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-24"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rechazando...
                </>
              ) : (
                "Rechazar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
