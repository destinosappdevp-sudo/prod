"use client";

import Link from "next/link";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";
import { SupabaseImage } from "./SupabaseImage";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface HostListingCardProps {
  imagePath: string;
  description: string;
  stateValue: string;
  municipalityValue?: string | null;
  price: number;
  title: string;
  homeId: string;
}

function HostListingCard({
  imagePath,
  description,
  stateValue,
  municipalityValue,
  price,
  title,
  homeId,
}: HostListingCardProps) {
  const { getStateByValue } = useVenezuelaStates();
  const { getMunicipalityByValue } = useVenezuelaMunicipalities();
  const state = getStateByValue(stateValue);
  const municipality = municipalityValue
    ? getMunicipalityByValue(stateValue, municipalityValue)
    : null;

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
      <Link href={`/home/${homeId}`} className="mt-2">
        <h3 className="font-medium text-base">
          {municipality ? municipality.label : state?.label}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-1">{title}</p>
        <p className="pt-2 text-muted-foreground">
          <span className="font-medium text-black">$ {price}</span> / noche por persona
        </p>
      </Link>
      <Link href={`/my-listing/${homeId}`} className="mt-3">
        <Button variant="outline" className="w-full" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Editar Anuncio
        </Button>
      </Link>
    </div>
  );
}

export default HostListingCard;
