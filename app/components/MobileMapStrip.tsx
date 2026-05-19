"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { type MapPin } from "./MultiPinMap";

const LazyMap = dynamic(() => import("./MultiPinMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-xl" />,
});

export default function MobileMapStrip({ pins }: { pins: MapPin[] }) {
  if (!pins.length) return null;
  return (
    <div className="lg:hidden w-full h-[48vw] max-h-[280px] rounded-xl overflow-hidden mt-4">
      <LazyMap pins={pins} />
    </div>
  );
}



