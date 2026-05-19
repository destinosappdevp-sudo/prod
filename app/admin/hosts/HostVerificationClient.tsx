"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
// import {
//   verifyHost,
//   unverifyHost,
//   getUnverifiedHosts,
// } from "@/app/actions/home";

interface UnverifiedHost {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  isVerified: boolean;
  verificationStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  verificationReason?: string | null;
  document1Image?: string | null;
  document2Image?: string | null;
  _count: {
    Home: number;
    Reservation: number;
  };
}

export default function HostVerificationClient() {
  const [unverifiedHosts, setUnverifiedHosts] = useState<UnverifiedHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHost, setSelectedHost] = useState<UnverifiedHost | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationReason, setVerificationReason] = useState(
    "Verificado por administración"
  );

  useEffect(() => {
    loadUnverifiedHosts();
  }, []);

  const loadUnverifiedHosts = async () => {
    try {
      setLoading(true);
      // const result = await getUnverifiedHosts();
      // if (result.success) {
      //   setUnverifiedHosts(result.hosts);
      // }
    } catch (error) {
      console.error("Error cargando hosts no verificados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedHost) return;

    try {
      setIsProcessing(true);
      // await verifyHost(selectedHost.id, verificationReason);
      setUnverifiedHosts(unverifiedHosts.filter((h) => h.id !== selectedHost.id));
      setShowVerifyDialog(false);
      setVerificationReason("Verificado por administración");
      setSelectedHost(null);
    } catch (error) {
      console.error("Error verificando host:", error);
      alert("Error al verificar el anfitrión");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando anfitriones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Verificación de Anfitriones
          </h2>
          <p className="text-gray-600 mt-1">
            Total no verificados: {unverifiedHosts.length} anfitrión
            {unverifiedHosts.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Button variant="outline" onClick={loadUnverifiedHosts}>
          Actualizar
        </Button>
      </div>

      {unverifiedHosts.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">¡Todos verificados!</h3>
          <p className="text-gray-600">
            No hay anfitriones pendientes de verificación
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {unverifiedHosts.map((host) => (
            <Card key={host.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">
                      {host.firstName} {host.lastName}
                    </h3>
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      No verificado
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">Email:</span> {host.email}
                    </p>
                    {host.phoneNumber && (
                      <p className="text-gray-700">
                        <span className="font-medium">Teléfono:</span>{" "}
                        {host.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg mb-4 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Alojamientos</p>
                      <p className="text-lg font-bold">{host._count.Home}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Reservas</p>
                      <p className="text-lg font-bold">{host._count.Reservation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Estado</p>
                      <p className="text-sm font-medium">{host.verificationStatus || "NOT_SUBMITTED"}</p>
                    </div>
                  </div>

                  {(host.document1Image || host.document2Image) && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mb-4">
                      <p className="font-medium mb-1">Documentos cargados:</p>
                      <div className="flex items-center gap-3">
                        {host.document1Image && (
                          <a href={host.document1Image} target="_blank" rel="noreferrer" className="underline">
                            Documento 1
                          </a>
                        )}
                        {host.document2Image && (
                          <a href={host.document2Image} target="_blank" rel="noreferrer" className="underline">
                            Documento 2
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {host._count.Home > 0 && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                      <p className="font-medium">⚠️ Atención</p>
                      <p>
                        Este anfitrión tiene {host._count.Home} alojamiento
                        {host._count.Home !== 1 ? "s" : ""} pendiente
                        {host._count.Home !== 1 ? "s" : ""} de aprobación
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    onClick={() => {
                      setSelectedHost(host);
                      setShowVerifyDialog(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verificar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Anfitrión</DialogTitle>
            <DialogDescription>
              ¿Deseas verificar a este anfitrión? Tendrá permisos para publicar
              alojamientos sin aprobación previa.
            </DialogDescription>
          </DialogHeader>

          {selectedHost && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold text-lg">
                  {selectedHost.firstName} {selectedHost.lastName}
                </p>
                <p className="text-sm text-gray-600">{selectedHost.email}</p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">Estadísticas:</p>
                  <p className="text-sm">
                    {selectedHost._count.Home} alojamientos •{" "}
                    {selectedHost._count.Reservation} reservas
                  </p>
                </div>
              </div>

              {selectedHost._count.Home > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">ℹ️ Nota:</span> Al verificar,
                    los alojamientos pendientes aún requerirán aprobación manual.
                    Solo los futuros serán auto-aprobados.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowVerifyDialog(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verificar Anfitrión
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



