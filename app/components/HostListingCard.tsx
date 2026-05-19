"use client";

import Link from "next/link";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";
import { SupabaseImage } from "./SupabaseImage";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock3,
  Edit,
  FileText,
  XCircle,
} from "lucide-react";

interface HostListingCardProps {
  imagePath: string;
  description: string;
  stateValue: string;
  municipalityValue?: string | null;
  price: number;
  title: string;
  homeId: string;
  publishStatus: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  approvalRejectionReason?: string | null;
}

function getStatusBadge(status: HostListingCardProps["publishStatus"]) {
  switch (status) {
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Publicado
        </span>
      );
    case "PENDING_APPROVAL":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">
          <Clock3 className="h-3.5 w-3.5" /> En revision
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <XCircle className="h-3.5 w-3.5" /> Rechazado
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          <FileText className="h-3.5 w-3.5" /> Borrador
        </span>
      );
  }
}

function HostListingCard({
  imagePath,
  description,
  stateValue,
  municipalityValue,
  price,
  title,
  homeId,
  publishStatus,
  approvalRejectionReason,
}: HostListingCardProps) {
  const { getStateByValue } = useVenezuelaStates();
  const { getMunicipalityByValue } = useVenezuelaMunicipalities();
  const state = getStateByValue(stateValue);
  const municipality = municipalityValue
    ? getMunicipalityByValue(stateValue, municipalityValue)
    : null;
  const locationLabel = municipality?.label || state?.label || "Ubicacion pendiente";

  return (
    <div className="flex flex-col">
      <div className="relative h-72">
        <SupabaseImage
          imagePath={imagePath}
          alt="Image of House"
          fill
          className="rounded-lg h-full object-cover"
        />
      </div>
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-base">{locationLabel}</h3>
          {getStatusBadge(publishStatus)}
        </div>
        <p className="text-muted-foreground text-sm line-clamp-1">{title}</p>
        <p className="pt-2 text-muted-foreground">
          <span className="text-xs text-gray-500">Precio Desde</span> <span className="font-medium text-black">$ {price}</span>
        </p>

        {publishStatus === "REJECTED" && approvalRejectionReason ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700 line-clamp-3">
            Motivo del rechazo: {approvalRejectionReason}
          </p>
        ) : null}
      </div>
      <div className="mt-3">
        <Link href={`/my-listing/${homeId}`}>
          <Button variant="outline" className="w-full" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default HostListingCard;



