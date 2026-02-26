import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

function HomeMap({
  stateValue,
  municipalityValue,
}: {
  stateValue: string;
  municipalityValue?: string;
}) {
  const LazyMap = dynamic(() => import("@/app/components/Map"), {
    ssr: false,
    loading: () => <Skeleton className="h-[50vh] w-full" />,
  });

  return (
    <LazyMap
      stateValue={stateValue}
      municipalityValue={municipalityValue}
    />
  );
}

export default HomeMap;
