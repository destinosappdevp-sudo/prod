"use client";

import { SupabaseImage } from "@/app/components/SupabaseImage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Eye, Clock, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { buildHomeUrl } from "@/app/lib/slug";

interface HomeStatus {
  id: string;
  title: string;
  photo: string;
  price: number;
  country: string;
  municipality: string | null;
  publishStatus: string;
  approvalRejectionReason?: string;
  createdAt: string;
  slug?: string | null;
  categoryName?: string[] | null;
}

interface HostListingsClientProps {
  listings: HomeStatus[];
}

export default function HostListingsClient({
  listings,
}: HostListingsClientProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle size={14} /> Publicado
          </Badge>
        );
      case "PENDING_APPROVAL":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock size={14} /> Pendiente de aprobación
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <Eye size={14} /> Borrador
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <X size={14} /> Rechazado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!listings || listings.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center border border-dashed border-slate-300 rounded-2xl">
        <Eye className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-900 font-semibold mb-2 text-sm md:text-base">
          No tienes alojamientos
        </p>
        <p className="text-slate-500 text-xs md:text-sm">
          Créa tu primer alojamiento para empezar a recibir reservas
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {listings.map((home) => (
        <Card key={home.id} className="overflow-hidden hover:shadow-lg transition">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            {/* Imagen */}
            <div className="relative w-full md:w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
              {home.photo ? (
                <SupabaseImage
                  imagePath={home.photo}
                  alt={home.title || "Propiedad"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{home.title}</h3>
                    <p className="text-sm text-gray-600">
                      {home.country} {home.municipality && `- ${home.municipality}`}
                    </p>
                  </div>
                  {getStatusBadge(home.publishStatus)}
                </div>

                <p className="text-sm font-bold text-orange-600 mt-2">
                  Desde ${home.price}
                </p>

                {/* Mostrar razón de rechazo si está rechazado */}
                {home.publishStatus === "REJECTED" &&
                  home.approvalRejectionReason && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs font-medium text-red-800">
                        Razón del rechazo:
                      </p>
                      <p className="text-sm text-red-700">
                        {home.approvalRejectionReason}
                      </p>
                    </div>
                  )}

                {/* Mostrar mensaje para pendientes */}
                {home.publishStatus === "PENDING_APPROVAL" && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs font-medium text-yellow-800">
                      Tu alojamiento está en revisión
                    </p>
                    <p className="text-sm text-yellow-700">
                      Un superadmin lo aprobará pronto. Puedes seguir editándolo mientras
                      esperas.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Publicado: {new Date(home.createdAt).toLocaleDateString("es-ES")}
              </p>
            </div>

            {/* Acción */}
            <div className="flex items-center">
              <Link href={buildHomeUrl(home.slug, home.id, home.categoryName)}>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm">
                  Ver detalles
                </button>
              </Link>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}



