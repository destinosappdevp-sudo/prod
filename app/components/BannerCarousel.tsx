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

interface BannerCarouselProps {
  fullWidth?: boolean;
  compactHeight?: boolean;
  showTitle?: boolean;
  doubleHeight?: boolean;
  showArrows?: boolean;
  autoRotate?: boolean;
  autoRotateMs?: number;
}

export default function BannerCarousel({
  fullWidth = false,
  compactHeight = false,
  showTitle = true,
  doubleHeight = false,
  showArrows = true,
  autoRotate = false,
  autoRotateMs = 5000,
}: BannerCarouselProps) {
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

  useEffect(() => {
    if (!autoRotate || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.max(0, banners.length - itemsPerPage);
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, autoRotateMs);

    return () => clearInterval(interval);
  }, [autoRotate, autoRotateMs, banners.length, itemsPerPage]);

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
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {showTitle && banner.title && (
                <div className="absolute bottom-4 left-5">
                  <p className="text-white text-2xl font-bold drop-shadow-md leading-tight">{banner.title}</p>
                </div>
              )}
            </>
          );

          return bannerUrl ? (
            <a
              key={banner.id}
              href={bannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`relative block overflow-hidden shadow-lg group ${
                fullWidth
                  ? doubleHeight
                    ? "h-[520px] sm:h-[620px] md:h-[720px] lg:h-[840px]"
                    : compactHeight
                    ? "h-[380px] sm:h-[440px] md:h-[520px] lg:h-[600px]"
                    : "h-[460px] sm:h-[520px] md:h-[600px] lg:h-[700px]"
                  : "aspect-[5/2] sm:aspect-[5/1] rounded-lg"
              }`}
            >
              {bannerContent}
            </a>
          ) : (
            <div
              key={banner.id}
              className={`relative block overflow-hidden shadow-lg group ${
                fullWidth
                  ? doubleHeight
                    ? "h-[520px] sm:h-[620px] md:h-[720px] lg:h-[840px]"
                    : compactHeight
                    ? "h-[380px] sm:h-[440px] md:h-[520px] lg:h-[600px]"
                    : "h-[460px] sm:h-[520px] md:h-[600px] lg:h-[700px]"
                  : "aspect-[5/2] sm:aspect-[5/1] rounded-lg"
              }`}
            >
              {bannerContent}
            </div>
          );
        })}
      </div>

      {/* Botones de navegación - solo si hay más banners */}
      {showArrows && banners.length > itemsPerPage && (
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

        </>
      )}

      {/* Indicadores de página */}
      {banners.length > itemsPerPage && (
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
      )}
    </div>
  );
}
