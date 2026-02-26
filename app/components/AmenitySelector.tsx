"use client";

import Image from "next/image";
import { Check, X, Minus } from "lucide-react";

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

const statusStyles: Record<AmenityStatus, string> = {
  YES: "bg-green-100 text-green-700 border-green-200",
  NO: "bg-red-100 text-red-700 border-red-200",
  UNSPECIFIED: "bg-gray-100 text-gray-500 border-gray-200",
};

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
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded border ${statusStyles[currentStatus]}`}
                    >
                      {currentStatus === "YES"
                        ? "Si"
                        : currentStatus === "NO"
                        ? "No"
                        : ""}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={`h-8 w-8 rounded border flex items-center justify-center ${
                          currentStatus === "YES"
                            ? statusStyles.YES
                            : "bg-white text-gray-400"
                        }`}
                        onClick={() => onChange(amenity.id, "YES")}
                        aria-label="Si"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`h-8 w-8 rounded border flex items-center justify-center ${
                          currentStatus === "NO"
                            ? statusStyles.NO
                            : "bg-white text-gray-400"
                        }`}
                        onClick={() => onChange(amenity.id, "NO")}
                        aria-label="No"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={`h-8 w-8 rounded border flex items-center justify-center ${
                          currentStatus === "UNSPECIFIED"
                            ? statusStyles.UNSPECIFIED
                            : "bg-white text-gray-400"
                        }`}
                        onClick={() => onChange(amenity.id, "UNSPECIFIED")}
                        aria-label="Sin especificar"
                      >
                        <Minus className="h-4 w-4" />
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
