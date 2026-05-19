"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupabaseImage } from "@/app/components/SupabaseImage";
import { approveHome, rejectHome } from "@/app/action";

interface PendingHome {
  id: string;
  title: string;
  description: string;
  country: string;
  municipality: string | null;
  price: number;
  photo: string;
  categoryName: string[] | null;
  publishStatus: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isVerified: boolean;
  };
  createdAt: Date;
}

interface AlojamientosClientProps {
  homes: PendingHome[];
  userId: string;
}

export default function AlojamientosClient({
  homes: initialHomes,
  userId,
}: AlojamientosClientProps) {
  const router = useRouter();
  const [homes, setHomes] = useState<PendingHome[]>(initialHomes);
  const [selectedHome, setSelectedHome] = useState<PendingHome | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  const handleApprove = async (homeId: string) => {
    setActionLoading(true);
    try {
      const result = await approveHome(homeId, userId);
      if (result.success) {
        setHomes(homes.filter((h) => h.id !== homeId));
        router.refresh();
      } else {
        alert(result.error || "Error al aprobar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al aprobar el alojamiento");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHome) return;

    setActionLoading(true);
    try {
      const result = await rejectHome(selectedHome.id, userId, rejectReason);
      if (result.success) {
        setHomes(homes.filter((h) => h.id !== selectedHome.id));
        setIsRejectDialogOpen(false);
        setRejectReason("");
        setSelectedHome(null);
        router.refresh();
      } else {
        alert(result.error || "Error al rechazar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al rechazar el alojamiento");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestionar Alojamientos</h1>
        <p className="text-gray-600 mt-2">
          Aprueba o rechaza alojamientos pendientes de hosts no verificados
        </p>
      </div>

      {homes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 text-lg">
            No hay alojamientos pendientes de aprobación
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {homes.map((home) => (
            <Card key={home.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4 p-6">
                {/* Imagen */}
                <div className="w-full md:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                  {home.photo ? (
                    <SupabaseImage
                      imagePath={home.photo}
                      alt={home.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sin imagen
                    </div>
                  )}
                </div>

                {/* Información */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold">{home.title}</h3>
                      <p className="text-sm text-gray-600">
                        {home.country} {home.municipality && `- ${home.municipality}`}
                      </p>
                    </div>
                    <Badge variant="outline">Pendiente</Badge>
                  </div>

                  {/* Host Info */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium">
                      Host: {home.User.firstName} {home.User.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{home.User.email}</p>
                    <p className="text-sm mt-1">
                      {home.User.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">Verificado</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">No verificado</Badge>
                      )}
                    </p>
                  </div>

                  <p className="text-gray-700 line-clamp-2 whitespace-pre-line mb-3">{home.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-orange-600">
                        Desde ${home.price}
                      </p>
                      <p className="text-xs text-gray-500">
                        Publicado:{" "}
                        {new Date(home.createdAt).toLocaleDateString("es-ES")}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(home.id)}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Aprobar
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedHome(home);
                          setIsRejectDialogOpen(true);
                        }}
                        disabled={actionLoading}
                        variant="destructive"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para rechazar */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Alojamiento</DialogTitle>
            <DialogDescription>
              Proporciona una razón para el rechazo. El host recibirá esta información.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">
                Alojamiento: {selectedHome?.title}
              </p>
            </div>
            <Textarea
              placeholder="Razón del rechazo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-32"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? "Rechazando..." : "Rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}



