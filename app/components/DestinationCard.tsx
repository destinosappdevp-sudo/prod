"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar } from "lucide-react";

interface DestinationCardProps {
  slug: string;
  title: string | null;
  subtitle: string | null;
  imagePath: string | null;
  country: string | null;
  municipality: string | null;
  nextDate: string | null;
  nextTime: string | null;
  priceFrom: number | null;
  reviewCount: number;
}

export default function DestinationCard({
  slug,
  title,
  subtitle,
  imagePath,
  country,
  municipality,
  nextDate,
  nextTime,
  priceFrom,
  reviewCount,
}: DestinationCardProps) {
  return (
    <Link href={`/destinos/${slug}`} className="group block">
      <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
        <div className="relative aspect-[3/2] overflow-hidden">
          {imagePath ? (
            <Image
              src={imagePath}
              alt={title || "Destino"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-400">
              <MapPin className="h-10 w-10" />
            </div>
          )}
          {priceFrom !== null && priceFrom > 0 && (
            <div className="absolute bottom-3 left-3 rounded-full bg-[#040B42]/80 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              Desde ${priceFrom}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-bold text-[#0d1f58]">{title || "Sin título"}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{[municipality, country].filter(Boolean).join(", ") || "Ubicación no disponible"}</span>
          </div>
          {nextDate && (
            <div className="mt-2 flex items-center gap-1 text-sm text-[#040B42]">
              <Calendar className="h-4 w-4" />
              <span>
                Próxima salida: {nextDate}
                {nextTime ? ` · ${nextTime}` : ""}
              </span>
            </div>
          )}
          {reviewCount > 0 && (
            <p className="mt-2 text-xs text-gray-500">{reviewCount} reseña{reviewCount > 1 ? "s" : ""}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
