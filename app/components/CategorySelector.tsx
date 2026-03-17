"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Home,
  Bed,
  Star,
  Tent,
  Building,
  Building2,
  Mountain,
  Gem,
  Waves,
  Eye,
} from "lucide-react";

type PropertyType = {
  id: number;
  name: string;
  icon: string | null;
};

interface CategorySelectorProps {
  hasError?: boolean;
}

function normalizeCategoryLabel(name: string) {
  if (!name) return "";

  if (name.includes("Ã") || name.includes("Â")) {
    try {
      const bytes = Uint8Array.from(name, (char) => char.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return name;
    }
  }

  return name;
}

const iconMap = {
  home: Home,
  bed: Bed,
  star: Star,
  tent: Tent,
  building: Building,
  apartment: Building2,
  cabin: Mountain,
  glamping: Tent,
  "full-house": Home,
  "country-house": Mountain,
  "tiny-house": Home,
  luxury: Gem,
  beach: Waves,
  view: Eye,
} as const;

function CategorySelector({ hasError = false }: CategorySelectorProps) {
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [selectedPropertyTypeIds, setSelectedPropertyTypeIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/property-types", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las categorías");
        }

        const data: PropertyType[] = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error("Error loading property types:", error);
        setLoadError("No se pudieron cargar las categorías. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    void fetchCategories();
  }, []);

  return (
    <div className="grid grid-cols-4 gap-8 mt-10 w-3/5 mx-auto mb-36">
      <input
        type="hidden"
        name="categoryName"
        value={selectedCategoryNames.join(",")}
      />
      <input
        type="hidden"
        name="propertyTypeId"
        value={selectedPropertyTypeIds[0]?.toString() || ""}
      />
      {selectedPropertyTypeIds.map((propertyTypeId) => (
        <input
          key={propertyTypeId}
          type="hidden"
          name="propertyTypeIds"
          value={propertyTypeId}
        />
      ))}

      {loading ? (
        <p>Cargando categorías...</p>
      ) : loadError ? (
        <p className="col-span-4 text-sm text-red-600">{loadError}</p>
      ) : categories.map((item) => (
        <div key={item.id} className="cursor-pointer">
          <Card
            className={
              selectedPropertyTypeIds.includes(item.id)
                ? "border-primary"
                : hasError && selectedPropertyTypeIds.length === 0
                ? "border-red-300"
                : ""
            }
            onClick={() => {
              setSelectedPropertyTypeIds((prev) => {
                if (prev.includes(item.id)) {
                  return prev.filter((id) => id !== item.id);
                }
                return [...prev, item.id];
              });

              setSelectedCategoryNames((prev) => {
                if (prev.includes(item.name)) {
                  return prev.filter((name) => name !== item.name);
                }
                return [...prev, item.name];
              });
            }}
          >
            <CardHeader>
              {(() => {
                const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Home;
                return <IconComponent className="w-8 h-8" />;
              })()}
              <h3 className="font-medium">{normalizeCategoryLabel(item.name)}</h3>
            </CardHeader>
          </Card>
        </div>
      ))}

      {!loading && !loadError && (
        <p className="col-span-4 text-sm text-gray-600">
          {selectedPropertyTypeIds.length > 0
            ? `${selectedPropertyTypeIds.length} categoría(s) seleccionada(s)`
            : "Selecciona una o varias categorías"}
        </p>
      )}

      {hasError && selectedPropertyTypeIds.length === 0 && !loading && (
        <p className="col-span-4 text-sm text-red-600">
          Debes elegir al menos una categoría para continuar.
        </p>
      )}
    </div>
  );
}

export default CategorySelector;
