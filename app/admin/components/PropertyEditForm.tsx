"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVenezuelaMunicipalities } from "@/app/lib/venezuelaMunicipalities";

interface PropertyEditFormProps {
  property: {
    id: string;
    title: string | null;
    description: string | null;
    guests: string | null;
    bedrooms: string | null;
    bathrooms: string | null;
    country: string | null;
    municipality: string | null;
    exactAddress: string | null;
    checkInTime: string | null;
    contactNumber: string | null;
    photo: string | null;
    price: number | null;
    categoryName: string | null;
    addedCategory: boolean;
    addedDescription: boolean;
    addedLocation: boolean;
  };
  categories: Array<{ name: string; title: string }>;
  states: Array<{ value: string; label: string }>;
  updateEndpoint?: string;
}

export default function PropertyEditForm({
  property,
  categories,
  states,
  updateEndpoint,
}: PropertyEditFormProps) {
  const router = useRouter();
  const { getMunicipalitiesByState, getDefaultMunicipalityByState } =
    useVenezuelaMunicipalities();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: property.title || "",
    description: property.description || "",
    guests: property.guests || "",
    bedrooms: property.bedrooms || "",
    bathrooms: property.bathrooms || "",
    country: property.country || "",
    municipality: property.municipality || "",
    exactAddress: property.exactAddress || "",
    checkInTime: property.checkInTime || "",
    contactNumber: property.contactNumber || "",
    price: property.price?.toString() || "",
    categoryName: property.categoryName || "",
  });

  const municipalities = useMemo(() => {
    return getMunicipalitiesByState(formData.country);
  }, [formData.country, getMunicipalitiesByState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("guests", formData.guests);
      payload.append("bedrooms", formData.bedrooms);
      payload.append("bathrooms", formData.bathrooms);
      payload.append("country", formData.country);
      payload.append("municipality", formData.municipality);
      payload.append("exactAddress", formData.exactAddress);
      payload.append("checkInTime", formData.checkInTime);
      payload.append("contactNumber", formData.contactNumber);
      payload.append("price", formData.price);
      payload.append("categoryName", formData.categoryName);
      if (imageFile) {
        payload.append("image", imageFile);
      }

      const endpoint =
        updateEndpoint ?? `/api/admin/properties/${property.id}`;
      const response = await fetch(endpoint, {
        method: "PATCH",
        body: payload,
      });

      if (!response.ok) {
        throw new Error("Error al actualizar la propiedad");
      }

      alert("Propiedad actualizada exitosamente");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la propiedad");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Título de la propiedad"
                />
              </div>
              <div>
                <Label htmlFor="categoryName">Categoría</Label>
                <Select
                  value={formData.categoryName}
                  onValueChange={(value) => handleChange("categoryName", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción de la propiedad"
              rows={4}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Características</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="guests">Huéspedes</Label>
                <Input
                  id="guests"
                  type="number"
                  value={formData.guests}
                  onChange={(e) => handleChange("guests", e.target.value)}
                  placeholder="Número de huéspedes"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Habitaciones</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange("bedrooms", e.target.value)}
                  placeholder="Número de habitaciones"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Baños</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                  placeholder="Número de baños"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Ubicación y Precio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Estado</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    handleChange("country", value);
                    const defaultMunicipality =
                      getDefaultMunicipalityByState(value)?.value || "";
                    handleChange("municipality", defaultMunicipality);
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
                    {municipalities.map((municipality) => (
                      <SelectItem
                        key={municipality.value}
                        value={municipality.value}
                      >
                        {municipality.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Precio por noche (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="Precio por noche"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInTime">Hora de ingreso</Label>
                <Input
                  id="checkInTime"
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange("checkInTime", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Numero de contacto</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", e.target.value)}
                  placeholder="Ej: +58 412 123 4567"
                  className="text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="exactAddress">Direccion exacta</Label>
              <Input
                id="exactAddress"
                type="text"
                value={formData.exactAddress}
                onChange={(e) => handleChange("exactAddress", e.target.value)}
                placeholder="Ej: Av. Principal, calle 10, casa 2"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="image">Imagen (opcional)</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
