import DestinationView from "../_components/DestinationView";
import DestinationViewLegacy from "../_components/DestinationViewLegacy";
import PackageView from "../_components/PackageView";
import { getPlatformFeatures } from "@/app/lib/platform-features";
import { notFound } from "next/navigation";

export default async function DestinosCatchAll({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;

  if (segments.length === 1) {
    const features = await getPlatformFeatures();
    if (features.multiDatesPerDestinationEnabled === true) {
      return <DestinationView slug={segments[0]} />;
    }
    return <DestinationViewLegacy slug={segments[0]} />;
  }

  if (segments.length === 2) {
    return <PackageView categorySlug={segments[0]} slug={segments[1]} />;
  }

  notFound();
}