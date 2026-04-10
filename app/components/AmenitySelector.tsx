"use client";

import Image from "next/image";
import { X } from "lucide-react";

export type AmenityStatus = "YES" | "NO" | "UNSPECIFIED";

export interface AmenityOption {
  id: string;
  name: string;
  iconKey?: string | null;
  iconUrl?: string | null;
  status: AmenityStatus;
}

export interface AmenityCategoryOption {
  id: string;
  name: string;
  amenities: AmenityOption[];
}

interface AmenitySelectorProps {
  categories: AmenityCategoryOption[];
  valueMap: Record<string, AmenityStatus>;
  onChange: (amenityId: string, status: AmenityStatus) => void;
  readOnly?: boolean;
}

export default function AmenitySelector({
  categories,
  valueMap,
  onChange,
  readOnly,
}: AmenitySelectorProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id} className="space-y-3">
          <h4 className="text-base font-semibold">{category.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {category.amenities.map((amenity) => {
              const currentStatus = valueMap[amenity.id] || "UNSPECIFIED";
              return (
                <div
                  key={amenity.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {amenity.iconUrl ? (
                      <Image
                        src={amenity.iconUrl}
                        alt={amenity.name}
                        width={24}
                        height={24}
                        unoptimized
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-gray-100 text-xs flex items-center justify-center">
                        {amenity.iconKey?.slice(0, 2).toUpperCase() || "SV"}
                      </span>
                    )}
                    <span className="text-sm font-medium">{amenity.name}</span>
                  </div>

                  {readOnly ? (
                    currentStatus === "YES" ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded border bg-green-100 text-green-700 border-green-200">
                        Estándar
                      </span>
                    ) : currentStatus === "NO" ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded border bg-amber-100 text-amber-700 border-amber-200">
                        VIP
                      </span>
                    ) : null
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Estándar */}
                      <button
                        type="button"
                        className={`h-8 px-3 rounded border text-xs font-semibold transition-colors ${
                          currentStatus === "YES"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600"
                        }`}
                        onClick={() => onChange(amenity.id, "YES")}
                        aria-label="Estándar"
                      >
                        Estándar
                      </button>
                      {/* VIP */}
                      <button
                        type="button"
                        className={`h-8 px-3 rounded border text-xs font-semibold transition-colors ${
                          currentStatus === "NO"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600"
                        }`}
                        onClick={() => onChange(amenity.id, "NO")}
                        aria-label="VIP"
                      >
                        VIP
                      </button>
                      {/* Quitar selección */}
                      <button
                        type="button"
                        className={`h-8 w-8 rounded border flex items-center justify-center transition-colors ${
                          currentStatus === "UNSPECIFIED"
                            ? "bg-gray-100 text-gray-500 border-gray-300"
                            : "bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500"
                        }`}
                        onClick={() => onChange(amenity.id, "UNSPECIFIED")}
                        aria-label="Quitar selección"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
