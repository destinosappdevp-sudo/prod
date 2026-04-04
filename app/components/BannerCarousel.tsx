"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeExternalUrl } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  url: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(1);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch("/api/banners");
        const data = await response.json();
        setBanners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching banners:", error);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Siempre mostrar 1 banner a la vez
  useEffect(() => {
    setItemsPerPage(1);
  }, []);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? Math.max(0, banners.length - itemsPerPage) : prevIndex - 1
    );
  };

  const goToNext = () => {
    const maxIndex = Math.max(0, banners.length - itemsPerPage);
    setCurrentIndex((prevIndex) =>
      prevIndex >= maxIndex ? 0 : prevIndex + 1
    );
  };

  if (loading || banners.length === 0) {
    return null;
  }

  const visibleBanners = banners.slice(
    currentIndex,
    currentIndex + itemsPerPage
  );

  const maxIndex = Math.max(0, banners.length - itemsPerPage);
  const totalPages = maxIndex + 1;

  return (
    <div className="relative w-full mb-8">
      {/* Banner a ancho completo */}
      <div className="grid grid-cols-1">
        {visibleBanners.map((banner) => {
          const bannerUrl = normalizeExternalUrl(banner.url);

          const bannerContent = (
            <>
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                sizes="100vw"
                className="object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </>
          );

          return bannerUrl ? (
            <a
              key={banner.id}
              href={bannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block aspect-[5/1] rounded-lg overflow-hidden shadow-lg group"
            >
              {bannerContent}
            </a>
          ) : (
            <div
              key={banner.id}
              className="relative block aspect-[5/1] rounded-lg overflow-hidden shadow-lg group"
            >
              {bannerContent}
            </div>
          );
        })}
      </div>

      {/* Botones de navegación - solo si hay más banners */}
      {banners.length > itemsPerPage && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="absolute -left-5 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full shadow-md transition-colors"
            aria-label="Banners anteriores"
          >
            <ChevronLeft size={24} className="text-gray-800" />
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className="absolute -right-5 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full shadow-md transition-colors"
            aria-label="Próximos banners"
          >
            <ChevronRight size={24} className="text-gray-800" />
          </button>

          {/* Indicadores de página */}
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-orange-500" : "bg-gray-300"
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
