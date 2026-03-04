import React from "react";
import Image from "next/image";
import { Pencil, Trash2, ExternalLink } from "lucide-react";

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
}

interface BannerListProps {
  banners: Banner[];
  onEdit?: (banner: Banner) => void;
  onDelete?: (bannerId: string) => void;
}

export default function BannerList({ banners, onEdit, onDelete }: BannerListProps) {
  if (!banners.length) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center mt-6">
        <p className="text-gray-500">No hay banners registrados.</p>
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
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Banners Existentes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full">
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 text-gray-900">{banner.title}</h3>
              
              <div className="space-y-1.5 mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Periodo:</span>{" "}
                  {formatDate(banner.startDate)} - {formatDate(banner.endDate)}
                </p>
                
                {banner.url && (
                  <a
                    href={banner.url}
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
        ))}
      </div>
    </div>
  );
}
