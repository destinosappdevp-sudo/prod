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
import AmenitySelector, {
  AmenityCategoryOption,
  AmenityStatus,
} from "@/app/components/AmenitySelector";

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
    latitude?: number | null;
    longitude?: number | null;
    photo: string | null;
    price: number | null;
    priceVip?: number | null;
    propertyTypeId: number | null;
    propertyTypeIds?: number[] | null;
    addedCategory: boolean;
    addedDescription: boolean;
    addedLocation: boolean;
  };
  categories: Array<{ id: number; name: string; title: string }>;
  states: Array<{ value: string; label: string }>;
  amenityCategories: AmenityCategoryOption[];
  updateEndpoint?: string;
  allowDelete?: boolean;
  deleteEndpoint?: string;
  createMode?: boolean;
}

export default function PropertyEditForm({
  property,
  categories,
  states,
  amenityCategories,
  updateEndpoint,
  allowDelete = false,
  deleteEndpoint,
  createMode = false,
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
    latitude: property.latitude?.toString() || "",
    longitude: property.longitude?.toString() || "",
    price: property.price?.toString() || "",
    priceVip: property.priceVip?.toString() || "",
    propertyTypeIds:
      property.propertyTypeIds && property.propertyTypeIds.length > 0
        ? property.propertyTypeIds
        : property.propertyTypeId
        ? [property.propertyTypeId]
        : [],
  });

  const existingCoords =
    property.latitude != null && property.longitude != null
      ? `${property.latitude}, ${property.longitude}`
      : "";
  const [coordsInput, setCoordsInput] = useState(existingCoords);
  const [coordsParsed, setCoordsParsed] = useState(existingCoords !== "");

  const parseCoords = (value: string) => {
    setCoordsInput(value);
    const match = value.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (match) {
      setFormData((prev) => ({ ...prev, latitude: match[1], longitude: match[2] }));
      setCoordsParsed(true);
    } else {
      setFormData((prev) => ({ ...prev, latitude: "", longitude: "" }));
      setCoordsParsed(false);
    }
  };

  const initialAmenityMap = useMemo(() => {
    const map: Record<string, AmenityStatus> = {};
    amenityCategories.forEach((category) => {
      category.amenities.forEach((amenity) => {
        map[amenity.id] = amenity.status || "UNSPECIFIED";
      });
    });
    return map;
  }, [amenityCategories]);

  const [amenityMap, setAmenityMap] = useState(initialAmenityMap);

  const normalizeContactNumber = (value: string) => {
    const trimmed = value.trim();
    const hasLeadingPlus = trimmed.startsWith("+");
    const digitsOnly = trimmed.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`.slice(0, 14);
  };

  const requiredMissingClass =
    "border-red-300 placeholder:text-red-500 focus-visible:ring-red-400 focus-visible:border-red-400";
  const missingTitle = formData.title.trim().length === 0;
  const missingDescription = formData.description.trim().length === 0;
  const missingCategory = formData.propertyTypeIds.length === 0;
  const missingCountry = formData.country.trim().length === 0;
  const missingMunicipality = formData.municipality.trim().length === 0;
  const parsedPrice = Number(formData.price);
  const missingPrice =
    formData.price.trim().length === 0 ||
    Number.isNaN(parsedPrice) ||
    parsedPrice <= 0;
  const missingContactNumber = !/^\+?\d{7,14}$/.test(
    normalizeContactNumber(formData.contactNumber)
  );
  const missingAmenities = Object.values(amenityMap).every(
    (status) => status === "UNSPECIFIED"
  );

  const municipalities = useMemo(() => {
    return getMunicipalitiesByState(formData.country);
  }, [formData.country, getMunicipalitiesByState]);

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

  const handleAmenityChange = (amenityId: string, status: AmenityStatus) => {
    setAmenityMap((prev) => ({ ...prev, [amenityId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formData.propertyTypeIds.length === 0) {
        throw new Error("Debes seleccionar al menos una categoría");
      }

      if (missingContactNumber) {
        throw new Error(
          "Ingresa un número de contacto válido (solo números y + al inicio, de 7 a 14 caracteres)"
        );
      }

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
      if (formData.latitude) payload.append("latitude", formData.latitude);
      if (formData.longitude) payload.append("longitude", formData.longitude);
      payload.append("price", formData.price);
      if (formData.priceVip) payload.append("priceVip", formData.priceVip);

      const selectedCategories = categories.filter((category) =>
        formData.propertyTypeIds.includes(category.id)
      );
      const primaryCategory = selectedCategories[0];

      payload.append("categoryName", primaryCategory?.name || "");
      payload.append("propertyTypeId", primaryCategory?.id?.toString() || "");
      formData.propertyTypeIds.forEach((propertyTypeId) => {
        payload.append("propertyTypeIds", propertyTypeId.toString());
      });

      payload.append(
        "amenities",
        JSON.stringify(
          Object.entries(amenityMap).map(([amenityId, status]) => ({
            amenityId,
            status,
          }))
        )
      );

      if (imageFile) {
        payload.append("image", imageFile);
      }

      const endpoint = createMode
        ? (updateEndpoint ?? "/api/admin/properties")
        : (updateEndpoint ?? `/api/admin/properties/${property.id}`);
      const method = createMode ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        body: payload,
      });

      if (!response.ok) {
        let errorMessage = createMode ? "Error al crear el Paquete" : "Error al actualizar la Paquete";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      if (createMode) {
        const data = await response.json();
        alert("Paquete creado exitosamente");
        router.push(`/admin/properties/${data.id}`);
        router.refresh();
      } else {
        alert("Paquete actualizada exitosamente");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Error al actualizar la Paquete"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar esta Paquete? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const endpoint = deleteEndpoint ?? `/api/admin/properties/${property.id}`;
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Error al eliminar la Paquete";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      alert("Paquete eliminada exitosamente");
      router.push("/admin/properties");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Error al eliminar la Paquete"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label
                  htmlFor="title"
                  className={missingTitle ? "text-red-600" : undefined}
                >
                  Título
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder={
                    missingTitle
                      ? "Falta completar el título"
                      : "Título de la Paquete"
                  }
                  className={missingTitle ? requiredMissingClass : undefined}
                />
              </div>

              <div>
                <Label className={missingCategory ? "text-red-600" : undefined}>
                  Categorías
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona una o varias categorías para esta Paquete.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                            : missingCategory
                            ? "border-red-300 text-red-700 hover:border-red-400"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <p
                  className={`text-xs mt-2 ${
                    missingCategory ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  {formData.propertyTypeIds.length > 0
                    ? `${formData.propertyTypeIds.length} categoría(s) seleccionada(s)`
                    : "Sin categorías seleccionadas"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label
              htmlFor="description"
              className={missingDescription ? "text-red-600" : undefined}
            >
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={
                missingDescription
                  ? "Falta completar la descripción"
                  : "Descripción de la Paquete"
              }
              className={missingDescription ? requiredMissingClass : undefined}
              rows={4}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Características</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="guests">Cupos</Label>
                <Input
                  id="guests"
                  type="number"
                  value={formData.guests}
                  onChange={(e) => handleChange("guests", e.target.value)}
                  placeholder="Número de cupos"
                />
              </div>
              <div>
                <Label htmlFor="bedrooms">Zona VIP</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange("bedrooms", e.target.value)}
                  placeholder="Número de zonas VIP"
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Zona Estándar</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                  placeholder="Número de zonas estándar"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Ubicación y Precio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="country"
                  className={missingCountry ? "text-red-600" : undefined}
                >
                  Estado
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    handleChange("country", value);
                    const defaultMunicipality =
                      getDefaultMunicipalityByState(value)?.value || "";
                    handleChange("municipality", defaultMunicipality);
                  }}
                >
                  <SelectTrigger
                    className={missingCountry ? "border-red-300 text-red-600 focus-visible:ring-red-400" : undefined}
                  >
                    <SelectValue
                      placeholder={
                        missingCountry
                          ? "Selecciona un estado (obligatorio)"
                          : "Selecciona un estado"
                      }
                    />
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
                <Label
                  htmlFor="municipality"
                  className={missingMunicipality ? "text-red-600" : undefined}
                >
                  Municipio
                </Label>
                <Select
                  value={formData.municipality}
                  onValueChange={(value) => handleChange("municipality", value)}
                >
                  <SelectTrigger
                    className={missingMunicipality ? "border-red-300 text-red-600 focus-visible:ring-red-400" : undefined}
                  >
                    <SelectValue
                      placeholder={
                        missingMunicipality
                          ? "Selecciona un municipio (obligatorio)"
                          : "Selecciona un municipio"
                      }
                    />
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
                <Label
                  htmlFor="price"
                  className={missingPrice ? "text-red-600" : undefined}
                >
                  Precio del Paquete Estándar
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  min={1}
                  placeholder={
                    missingPrice
                      ? "Falta completar un precio válido"
                      : "Precio del Paquete Estándar"
                  }
                  className={missingPrice ? requiredMissingClass : undefined}
                />
              </div>
              <div>
                <Label htmlFor="priceVip">Precio del Paquete VIP</Label>
                <Input
                  id="priceVip"
                  type="number"
                  value={formData.priceVip}
                  onChange={(e) => handleChange("priceVip", e.target.value)}
                  min={1}
                  placeholder="Precio del Paquete VIP (opcional)"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Datos del Paquete</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInTime">Fecha y Hora de Salida</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange("checkInTime", e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label
                  htmlFor="contactNumber"
                  className={missingContactNumber ? "text-red-600" : undefined}
                >
                  Número de contacto
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  required
                  inputMode="tel"
                  maxLength={14}
                  pattern={"^\\+?\\d{7,14}$"}
                  title="Ingresa un número válido: solo números y + al inicio (7 a 14 caracteres)"
                  value={formData.contactNumber}
                  onChange={(e) =>
                    handleChange("contactNumber", normalizeContactNumber(e.target.value))
                  }
                  placeholder={
                    missingContactNumber
                      ? "Ingresa un número válido (7-14 dígitos)"
                      : "Ej: +584121234567"
                  }
                  className={`text-sm ${
                    missingContactNumber ? requiredMissingClass : ""
                  }`}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="exactAddress">Punto de Partida (Salida)</Label>
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
            <h3 className={`text-lg font-semibold mb-4 ${missingAmenities ? "text-red-600" : ""}`}>
              Servicios
            </h3>
            <p
              className={`text-sm mb-4 ${
                missingAmenities ? "text-red-600" : "text-muted-foreground"
              }`}
            >
              {missingAmenities
                ? "Selecciona al menos un servicio para completar el anuncio."
                : "Marca con un check si lo tienes, con una X si no, o déjalo en blanco."}
            </p>
            <AmenitySelector
              categories={amenityCategories}
              valueMap={amenityMap}
              onChange={handleAmenityChange}
            />
          </div>

          <div>
            <Label htmlFor="image">Imagen</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            {allowDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Eliminar Paquete
              </Button>
            )}
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
                  {createMode ? "Creando..." : "Guardando..."}
                </>
              ) : (
                createMode ? "Crear Paquete" : "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
