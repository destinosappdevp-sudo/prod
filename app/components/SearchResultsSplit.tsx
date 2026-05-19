"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { type MapPin } from "./MultiPinMap";

const LazyMap = dynamic(() => import("./MultiPinMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

interface SearchResultsSplitProps {
  pins: MapPin[];
  children: React.ReactNode;
}

export default function SearchResultsSplit({ pins, children }: SearchResultsSplitProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mt-6 h-auto lg:h-[calc(100vh-200px)]">
      {/* Map — first on mobile (order-1), right on desktop (lg:order-2) */}
      <div className="w-full order-1 lg:order-2 lg:w-1/2 h-[48vw] max-h-[300px] lg:h-full lg:max-h-none rounded-xl overflow-hidden lg:sticky lg:top-[90px]">
        <LazyMap pins={pins} />
      </div>

      {/* Cards — second on mobile (order-2), left on desktop (lg:order-1) */}
      <div className="w-full order-2 lg:order-1 lg:w-1/2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}



