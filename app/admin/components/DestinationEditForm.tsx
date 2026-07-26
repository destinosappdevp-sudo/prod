"use client";

import { useMemo, useRef, useState } from "react";
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

interface DestinationEditFormProps {
  destination: {
    id: string;
    title: string | null;
    subtitle: string | null;
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
    latitude?: number | null;
    longitude?: number | null;
    checkInTime: string | null;
    propertyTypeIds?: number[] | null;
    propertyTypeId?: number | null;
    publishStatus?: string;
  };
  categories: Array<{ id: number; name: string; title: string }>;
  states: Array<{ value: string; label: string }>;
  createMode?: boolean;
}

export default function DestinationEditForm({
  destination,
  categories,
  states,
  createMode = false,
}: DestinationEditFormProps) {
  const router = useRouter();
  const { getMunicipalitiesByState, getDefaultMunicipalityByState } = useVenezuelaMunicipalities();

  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: destination.title || "",
    subtitle: destination.subtitle || "",
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
    checkInTime: destination.checkInTime || "",
    propertyTypeIds:
      destination.propertyTypeIds && destination.propertyTypeIds.length > 0
        ? destination.propertyTypeIds
        : destination.propertyTypeId
        ? [destination.propertyTypeId]
        : [],
    publishStatus: destination.publishStatus || "APPROVED",
  });

  const existingCoords =
    destination.latitude != null && destination.longitude != null
      ? `${destination.latitude}, ${destination.longitude}`
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

  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const wrapDescriptionSelection = (before: string, after: string, fallback = "texto") => {
    const textarea = descriptionRef.current;
    const current = formData.description;

    if (!textarea) {
      handleChange("description", `${current}${before}${fallback}${after}`);
      return;
    }

    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const selectedText = current.slice(start, end);
    const content = selectedText || fallback;
    const wrapped = `${before}${content}${after}`;
    const nextValue = `${current.slice(0, start)}${wrapped}${current.slice(end)}`;

    handleChange("description", nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + content.length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.title || !formData.country || !formData.municipality) {
        throw new Error("Faltan campos obligatorios: título, estado o municipio");
      }

      if (formData.propertyTypeIds.length === 0) {
        throw new Error("Debes seleccionar al menos una categoría");
      }

      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("subtitle", formData.subtitle);
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
      payload.append("publishStatus", formData.publishStatus);

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

      const endpoint = createMode
        ? "/api/admin/destinations"
        : `/api/admin/destinations/${destination.id}`;
      const method = createMode ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        body: payload,
      });

      if (!response.ok) {
        let errorMessage = createMode ? "Error al crear el destino" : "Error al actualizar el destino";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // ignore
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      alert(createMode ? "Destino creado exitosamente" : "Destino actualizado exitosamente");
      if (createMode) {
        router.push(`/admin/properties/${data.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al guardar el destino");
    } finally {
      setIsLoading(false);
    }
  };

  const requiredMissingClass =
    "border-red-300 placeholder:text-red-500 focus-visible:ring-red-400 focus-visible:border-red-400";

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Información del Destino</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="Título del destino"
                  className={!formData.title ? requiredMissingClass : undefined}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtítulo (opcional)</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  placeholder="Subtítulo del destino"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className={formData.propertyTypeIds.length === 0 ? "text-red-600" : undefined}>
              Categorías
            </Label>
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
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descripción</Label>
            <div className="flex flex-wrap items-center gap-2 my-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => wrapDescriptionSelection("**", "**", "texto en negrita")}
              >
                Negrita
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => wrapDescriptionSelection("[center]", "[/center]", "texto centrado")}
              >
                Centrar
              </Button>
            </div>
            <Textarea
              ref={descriptionRef}
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción del destino"
              rows={4}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Ubicación</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Estado</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    handleChange("country", value);
                    const defaultMunicipality = getDefaultMunicipalityByState(value)?.value || "";
                    handleChange("municipality", defaultMunicipality);
                  }}
                >
                  <SelectTrigger className={!formData.country ? requiredMissingClass : undefined}>
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
                  <SelectTrigger className={!formData.municipality ? requiredMissingClass : undefined}>
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
                  placeholder="Ej: Av. Principal, calle 10, casa 2"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="coords">Coordenadas (lat, lng)</Label>
                <Input
                  id="coords"
                  value={coordsInput}
                  onChange={(e) => parseCoords(e.target.value)}
                  placeholder="Ej: 10.1234, -66.5678"
                  className={coordsInput && !coordsParsed ? "border-red-300" : undefined}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Datos de referencia (heredables)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Estos valores se copiarán a cada paquete hijo al crearlo, pero podrán modificarse en el hijo.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactNumber">Número de contacto</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", normalizeContactNumber(e.target.value))}
                  placeholder="Ej: +584121234567"
                />
              </div>
              <div>
                <Label htmlFor="checkInTime">Fecha y hora de salida (referencia)</Label>
                <Input
                  id="checkInTime"
                  type="datetime-local"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange("checkInTime", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="price">Precio Estándar</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="Precio de referencia"
                />
              </div>
              <div>
                <Label htmlFor="priceVip">Precio VIP</Label>
                <Input
                  id="priceVip"
                  type="number"
                  value={formData.priceVip}
                  onChange={(e) => handleChange("priceVip", e.target.value)}
                  placeholder="Precio VIP de referencia"
                />
              </div>
              <div>
                <Label htmlFor="vipSeats">Cupos VIP</Label>
                <Input
                  id="vipSeats"
                  type="number"
                  value={formData.vipSeats}
                  onChange={(e) => handleChange("vipSeats", e.target.value)}
                  placeholder="Cupos VIP de referencia"
                />
              </div>
              <div>
                <Label htmlFor="standardSeats">Cupos Estándar</Label>
                <Input
                  id="standardSeats"
                  type="number"
                  value={formData.standardSeats}
                  onChange={(e) => handleChange("standardSeats", e.target.value)}
                  placeholder="Cupos Estándar de referencia"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="publishStatus">Estado de publicación</Label>
            <Select
              value={formData.publishStatus}
              onValueChange={(value) => handleChange("publishStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="PENDING_APPROVAL">Pendiente</SelectItem>
                <SelectItem value="APPROVED">Aprobado</SelectItem>
                <SelectItem value="REJECTED">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image">Imagen del Destino</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            {destination.photo && !imageFile && (
              <p className="text-xs text-muted-foreground mt-1">Ya existe una imagen. Sube una nueva para reemplazarla.</p>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {createMode ? "Creando..." : "Guardando..."}
                </>
              ) : (
                createMode ? "Crear Destino" : "Guardar Cambios"
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
}
