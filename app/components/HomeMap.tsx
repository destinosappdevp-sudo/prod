"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

function HomeMap({
  stateValue,
  municipalityValue,
  exactAddress,
  latitude,
  longitude,
}: {
  stateValue: string;
  municipalityValue?: string;
  exactAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const LazyMap = dynamic(() => import("@/app/components/Map"), {
    ssr: false,
    loading: () => <Skeleton className="h-[50vh] w-full" />,
  });

  return (
    <LazyMap
      stateValue={stateValue}
      municipalityValue={municipalityValue}
      exactAddress={exactAddress}
      latitude={latitude}
      longitude={longitude}
    />
  );
}

export default HomeMap;
