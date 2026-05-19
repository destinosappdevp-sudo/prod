import React from "react";
import Image from "next/image";
import { Pencil, Trash2, ExternalLink } from "lucide-react";
import { normalizeExternalUrl } from "@/lib/utils";

export interface Banner {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  url?: string;
  clientPhone?: string;
  clientEmail?: string;
  cost?: number;
  imageUrl: string;
  tipo?: string;
}

interface BannerListProps {
  banners: Banner[];
  onEdit?: (banner: Banner) => void;
  onDelete?: (bannerId: string) => void;
  emptyMessage?: string;
}

const TIPO_LABELS: Record<string, string> = {
  HERO1: "Hero 1",
  HERO2: "Hero 2",
  MEDIO1: "Medio 1",
  MEDIO2: "Medio 2",
  POP: "POP",
};

const TIPO_COLORS: Record<string, string> = {
  HERO1: "bg-indigo-600",
  HERO2: "bg-violet-600",
  MEDIO1: "bg-sky-600",
  MEDIO2: "bg-teal-600",
  POP: "bg-rose-600",
};

export default function BannerList({ banners, onEdit, onDelete, emptyMessage = "No hay banners registrados." }: BannerListProps) {
  if (!banners.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center mt-6">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => {
          const bannerUrl = normalizeExternalUrl(banner.url);

          return (
            <div key={banner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Barra de tipo en la parte superior */}
              <div className={`${TIPO_COLORS[banner.tipo ?? ""] ?? "bg-gray-500"} px-4 py-1.5 flex items-center justify-between`}>
                <span className="text-white text-xs font-bold tracking-wide uppercase">
                  {TIPO_LABELS[banner.tipo ?? ""] ?? banner.tipo ?? "Sin tipo"}
                </span>
                <span className="text-white/70 text-xs">{banner.title}</span>
              </div>
              <div className="relative h-48 w-full">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-base text-gray-900 mb-2">{banner.title}</h3>
                
                <div className="space-y-1.5 mb-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Periodo:</span>{" "}
                    {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
                  </p>
                  
                  {bannerUrl && (
                    <a
                      href={bannerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Visitar enlace
                    </a>
                  )}
                  
                  {banner.cost && banner.cost > 0 && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Costo:</span> ${banner.cost.toFixed(2)}
                    </p>
                  )}
                  
                  {(banner.clientEmail || banner.clientPhone) && (
                    <p className="text-xs text-gray-500 pt-1 border-t border-gray-100">
                      Cliente: {banner.clientEmail || banner.clientPhone}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(banner)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                  
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el banner "${banner.title}"?`)) {
                          onDelete(banner.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



