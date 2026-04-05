"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { normalizeExternalUrl } from "@/lib/utils";

interface PopupBanner {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
}

export default function BannerPopup() {
  const [banner, setBanner] = useState<PopupBanner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchPopup() {
      try {
        const res = await fetch("/api/banners/popup");
        const data = await res.json();
        if (data?.id) {
          setBanner(data);
          setVisible(true);
        }
      } catch {
        // silently ignore
      }
    }
    fetchPopup();
  }, []);

  if (!visible || !banner) return null;

  const href = banner.url ? normalizeExternalUrl(banner.url) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>

        {/* Imagen */}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setVisible(false)}
            className="block"
          >
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={banner.imageUrl}
                alt={banner.title || "Promoción"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {banner.title && (
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-slate-700">{banner.title}</p>
              </div>
            )}
          </a>
        ) : (
          <>
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={banner.imageUrl}
                alt={banner.title || "Promoción"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {banner.title && (
              <div className="px-5 py-4">
                <p className="text-sm font-medium text-slate-700">{banner.title}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
