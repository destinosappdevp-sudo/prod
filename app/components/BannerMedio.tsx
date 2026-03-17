"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface MedioBanner {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
  tipo: "MEDIO1" | "MEDIO2";
}

interface BannerMedioProps {
  /** "MEDIO1" va entre Región Centro y Oriente. "MEDIO2" entre Oriente y Occidente. */
  tipo: "MEDIO1" | "MEDIO2";
}

export default function BannerMedio({ tipo }: BannerMedioProps) {
  const [banner, setBanner] = useState<MedioBanner | null>(null);

  useEffect(() => {
    fetch("/api/banners/medio")
      .then((r) => r.json())
      .then((data: MedioBanner[] | { error?: string }) => {
        const list = Array.isArray(data) ? data : [];
        const match = list.find((b) => b.tipo === tipo);
        setBanner(match ?? null);
      })
      .catch(() => {});
  }, [tipo]);

  if (!banner) return null;

  const content = (
    <div className="relative w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm">
      {/* 970×90 — aspect ratio 970/90 ≈ 10.78:1 */}
      <div className="w-full" style={{ paddingBottom: `${(90 / 970) * 100}%`, position: "relative" }}>
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          sizes="(max-width: 1024px) 100vw, 970px"
          className="object-cover"
          unoptimized
        />
      </div>
    </div>
  );

  return (
    <div className="w-full my-2">
      {banner.url ? (
        <a href={banner.url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
