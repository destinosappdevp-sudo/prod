"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AmenitySelector, {
  AmenityCategoryOption,
  AmenityStatus,
} from "./AmenitySelector";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CreateAmenitiesFormProps {
  homeId: string;
  categories: AmenityCategoryOption[];
}

export default function CreateAmenitiesForm({
  homeId,
  categories,
}: CreateAmenitiesFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const initialMap = useMemo(() => {
    const map: Record<string, AmenityStatus> = {};
    categories.forEach((category) => {
      category.amenities.forEach((amenity) => {
        map[amenity.id] = amenity.status || "UNSPECIFIED";
      });
    });
    return map;
  }, [categories]);
  const [amenityMap, setAmenityMap] = useState(initialMap);

  const handleChange = (amenityId: string, status: AmenityStatus) => {
    setAmenityMap((prev) => ({ ...prev, [amenityId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = Object.entries(amenityMap).map(([amenityId, status]) => ({
        amenityId,
        status,
      }));

      const response = await fetch(`/api/host/homes/${homeId}/amenities`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amenities: payload }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar servicios");
      }

      router.push(`/create/${homeId}/address`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al guardar servicios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mx-auto w-3/5 mt-10 flex flex-col gap-y-5 mb-36">
        <AmenitySelector
          categories={categories}
          valueMap={amenityMap}
          onChange={handleChange}
        />
      </div>
      <div className="fixed w-full bottom-0 z-10 bg-white border-t h-24">
        <div className="flex items-center justify-between mx-auto px-5 lg:px-10 h-full">
          <Button variant="secondary" size="lg" type="button" onClick={() => router.back()}>
            Volver
          </Button>
          <Button type="submit" size="lg" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Siguiente"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
