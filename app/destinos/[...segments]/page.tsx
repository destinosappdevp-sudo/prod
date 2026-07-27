import DestinationView from "../_components/DestinationView";
import PackageView from "../_components/PackageView";
import { notFound } from "next/navigation";

export default async function DestinosCatchAll({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;

  if (segments.length === 1) {
    return <DestinationView slug={segments[0]} />;
  }

  if (segments.length === 2) {
    return <PackageView categorySlug={segments[0]} slug={segments[1]} />;
  }

  notFound();
}