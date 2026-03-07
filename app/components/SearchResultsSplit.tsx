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
      {/* Cards — left on desktop, top on mobile */}
      <div className="w-full lg:w-1/2 overflow-y-auto pr-1">
        {children}
      </div>

      {/* Map — right on desktop, bottom on mobile */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-full sticky top-[90px]">
        <LazyMap pins={pins} />
      </div>
    </div>
  );
}
