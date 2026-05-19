"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  title: string;
  children: React.ReactNode;
}

export function HorizontalCarousel({ title, children }: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkScroll]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <ChevronRight className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
      </div>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-5 top-[40%] -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow-md p-2 hover:shadow-lg hover:scale-110 transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto pb-3 hide-scrollbar"
        >
          {children}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-5 top-[40%] -translate-y-1/2 z-20 bg-white border border-gray-200 rounded-full shadow-md p-2 hover:shadow-lg hover:scale-110 transition-all"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
    </section>
  );
}



