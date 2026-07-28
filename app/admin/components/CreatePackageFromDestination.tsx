"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVenezuelaMunicipalities } from "@/app/lib/venezuelaMunicipalities";

interface CreatePackageFromDestinationProps {
  destination: {
    id: string;
    title: string | null;
    description: string | null;
    photo: string | null;
    price: number | null;
    priceVip: number | null;
    vipSeats: number | null;
    standardSeats: number | null;
    country: string | null;
    municipality: string | null;
    exactAddress: string | null;
    contactNumber: string | null;
    latitude: number | null;
    longitude: number | null;
    categoryName: string[];
    propertyTypeId: number[];
  };
  categories: Array<{ id: number; name: string; title: string }>;
  states: Array<{ value: string; label: string }>;
}

export default function CreatePackageFromDestination({
  destination,
  categories,
  states,
}: CreatePackageFromDestinationProps) {
  const router = useRouter();
  const { getMunicipalitiesByState, getDefaultMunicipalityByState } = useVenezuelaMunicipalities();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: destination.title || "",
    description: destination.description || "",
    country: destination.country || "",
    municipality: destination.municipality || "",
    exactAddress: destination.exactAddress || "",
    contactNumber: destination.contactNumber || "",
    latitude: destination.latitude?.toString() || "",
    longitude: destination.longitude?.toString() || "",
    price: destination.price?.toString() || "",
    priceVip: destination.priceVip?.toString() || "",
    vipSeats: destination.vipSeats?.toString() || "",
    standardSeats: destination.standardSeats?.toString() || "",
    checkInTime: "",
    propertyTypeIds: destination.propertyTypeId || [],
  });

  const municipalities = useMemo(() => {
    return getMunicipalitiesByState(formData.country);
  }, [formData.country, getMunicipalitiesByState]);

  const normalizeContactNumber = (value: string) => {
    const trimmed = value.trim();
    const hasLeadingPlus = trimmed.startsWith("+");
    const digitsOnly = trimmed.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`.slice(0, 14);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePropertyType = (typeId: number) => {
    setFormData((prev) => ({
      ...prev,
      propertyTypeIds: prev.propertyTypeIds.includes(typeId)
        ? prev.propertyTypeIds.filter((id) => id !== typeId)
        : [...prev.propertyTypeIds, typeId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title || !formData.country || !formData.municipality) {
        throw new Error("Faltan campos obligatorios: título, estado o municipio");
      }
      if (!formData.checkInTime) {
        throw new Error("Debes indicar la fecha y hora de salida del paquete");
      }

      const vipSeats = parseInt(formData.vipSeats || "0", 10);
      const standardSeats = parseInt(formData.standardSeats || "0", 10);

      if (vipSeats <= 0 && standardSeats <= 0) {
        throw new Error("Debes configurar cupos en VIP, Estándar o ambos");
      }
      if (standardSeats > 0 && (!formData.price || Number(formData.price) <= 0)) {
        throw new Error("Indica un precio Estándar mayor a 0");
      }
      if (vipSeats > 0 && (!formData.priceVip || Number(formData.priceVip) <= 0)) {
        throw new Error("Indica un precio VIP mayor a 0");
      }


      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("country", formData.country);
      payload.append("municipality", formData.municipality);
      payload.append("exactAddress", formData.exactAddress);
      payload.append("contactNumber", formData.contactNumber);
      payload.append("checkInTime", formData.checkInTime);
      payload.append("price", formData.price);
      payload.append("priceVip", formData.priceVip);
      payload.append("vipSeats", formData.vipSeats);
      payload.append("standardSeats", formData.standardSeats);

      if (formData.latitude) payload.append("latitude", formData.latitude);
      if (formData.longitude) payload.append("longitude", formData.longitude);

      const selectedCategories = categories.filter((cat) =>
        formData.propertyTypeIds.includes(cat.id)
      );
      payload.append("categoryName", selectedCategories.map((c) => c.name).join(","));
      payload.append("propertyTypeId", selectedCategories[0]?.id?.toString() || "");
      formData.propertyTypeIds.forEach((id) => {
        payload.append("propertyTypeIds", id.toString());
      });

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const response = await fetch(`/api/admin/destinations/${destination.id}/packages`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear el paquete");
      }

      const data = await response.json();
      alert("Paquete creado exitosamente");
      router.push(`/admin/packages/${data.id}`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al crear el paquete");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nueva fecha
      </Button>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Nueva fecha / paquete</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="checkInTime">Fecha y hora de salida *</Label>
            <Input
              id="checkInTime"
              type="datetime-local"
              value={formData.checkInTime}
              onChange={(e) => handleChange("checkInTime", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="title">Título (heredado, editable)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="price">Precio Estándar</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="priceVip">Precio VIP</Label>
            <Input
              id="priceVip"
              type="number"
              value={formData.priceVip}
              onChange={(e) => handleChange("priceVip", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="standardSeats">Cupos Estándar</Label>
            <Input
              id="standardSeats"
              type="number"
              min={0}
              step={2}
              value={formData.standardSeats}
              onChange={(e) => handleChange("standardSeats", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="vipSeats">Cupos VIP</Label>
            <Input
              id="vipSeats"
              type="number"
              min={0}
              step={2}
              value={formData.vipSeats}
              onChange={(e) => handleChange("vipSeats", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="country">Estado</Label>
            <Select
              value={formData.country}
              onValueChange={(value) => {
                handleChange("country", value);
                handleChange("municipality", getDefaultMunicipalityByState(value)?.value || "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="municipality">Municipio</Label>
            <Select
              value={formData.municipality}
              onValueChange={(value) => handleChange("municipality", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un municipio" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="exactAddress">Punto de Partida</Label>
            <Input
              id="exactAddress"
              value={formData.exactAddress}
              onChange={(e) => handleChange("exactAddress", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="contactNumber">Contacto</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => handleChange("contactNumber", normalizeContactNumber(e.target.value))}
            />
          </div>
          <div className="col-span-2">
            <Label>Categorías</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {categories.map((cat) => {
                const selected = formData.propertyTypeIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => togglePropertyType(cat.id)}
                    className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-border"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2">
            <Label htmlFor="image">Imagen (opcional, hereda la del destino)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              "Crear Paquete"
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
