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
    vipSeats?: number | null;
    standardSeats?: number | null;
    propertyTypeId: number | null;
    propertyTypeIds?: number[] | null;
    addedCategory: boolean;
    addedDescription: boolean;
    addedLocation: boolean;
    isPrivate?: boolean;
    privateOwnerId?: string | null;
    privateOwnerName?: string | null;
    privateOwnerCedula?: string | null;
    transportType?: string;
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
    vipSeats: property.vipSeats?.toString() || "",
    standardSeats: property.standardSeats?.toString() || "",
    propertyTypeIds:
      property.propertyTypeIds && property.propertyTypeIds.length > 0
        ? property.propertyTypeIds
        : property.propertyTypeId
        ? [property.propertyTypeId]
        : [],
    isPrivate: property.isPrivate || false,
    privateOwnerId: property.privateOwnerId || "",
    transportType: property.transportType || "ENC32",
  });

  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState<Array<{ id: string; firstName: string; cedula: string; email: string }>>([]);
  const [ownerSearching, setOwnerSearching] = useState(false);
  const [ownerSelected, setOwnerSelected] = useState<{ id: string; firstName: string; cedula: string; email: string } | null>(
    property.privateOwnerId && property.privateOwnerName
      ? {
          id: property.privateOwnerId,
          firstName: property.privateOwnerName,
          cedula: property.privateOwnerCedula || "",
          email: "",
        }
      : null
  );

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
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);

  const normalizeContactNumber = (value: string) => {
    const trimmed = value.trim();
    const hasLeadingPlus = trimmed.startsWith("+");
    const digitsOnly = trimmed.replace(/\D/g, "");
    return `${hasLeadingPlus ? "+" : ""}${digitsOnly}`.slice(0, 14);
  };

  const parseSeatValue = (value: string) => {
    if (!value.trim()) return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  const currentVipSeats = parseSeatValue(formData.vipSeats || formData.bedrooms);
  const currentStandardSeats = parseSeatValue(formData.standardSeats || formData.bathrooms);

  const requiredMissingClass =
    "border-red-300 placeholder:text-red-500 focus-visible:ring-red-400 focus-visible:border-red-400";
  const missingTitle = formData.title.trim().length === 0;
  const missingDescription = formData.description.trim().length === 0;
  const missingCategory = formData.propertyTypeIds.length === 0;
  const missingCountry = formData.country.trim().length === 0;
  const missingMunicipality = formData.municipality.trim().length === 0;
  const parsedPrice = Number(formData.price);
  const missingPrice =
    currentStandardSeats > 0 &&
    (formData.price.trim().length === 0 ||
      Number.isNaN(parsedPrice) ||
      parsedPrice <= 0);
  const parsedPriceVip = Number(formData.priceVip);
  const missingPriceVip =
    currentVipSeats > 0 &&
    (formData.priceVip.trim().length === 0 ||
      Number.isNaN(parsedPriceVip) ||
      parsedPriceVip <= 0);
  const missingContactNumber = !/^\+?\d{7,14}$/.test(
    normalizeContactNumber(formData.contactNumber)
  );
  const missingAmenities = Object.values(amenityMap).every(
    (status) => status === "UNSPECIFIED"
  );

  const municipalities = useMemo(() => {
    return getMunicipalitiesByState(formData.country);
  }, [formData.country, getMunicipalitiesByState]);

  const TRANSPORT_CAPACITY: Record<string, number> = {
    ENC32: 31,
    VAN20: 19,
    VAN20_PASILLO: 19,
  };

  const TRANSPORT_LABELS: Record<string, string> = {
    ENC32: "Encava 32",
    VAN20: "Van 20",
    VAN20_PASILLO: "Van 20 Pasillo",
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "transportType") {
        const totalCapacity = TRANSPORT_CAPACITY[value] || 31;
        next.vipSeats = "0";
        next.standardSeats = totalCapacity.toString();
        next.bedrooms = "0";
        next.bathrooms = totalCapacity.toString();
        next.guests = totalCapacity.toString();
      } else if (field === "vipSeats" || field === "bedrooms") {
        const vipValue = field === "vipSeats" ? value : value;
        const totalCapacity = TRANSPORT_CAPACITY[next.transportType || "ENC32"] || 31;
        let vip = parseSeatValue(vipValue);
        if (vip > totalCapacity) vip = totalCapacity;
        const std = Math.max(0, totalCapacity - vip);
        next.vipSeats = vip.toString();
        next.standardSeats = std.toString();
        next.bedrooms = vip.toString();
        next.bathrooms = std.toString();
        next.guests = totalCapacity.toString();
      } else if (field === "standardSeats" || field === "bathrooms") {
        next.standardSeats = field === "standardSeats" ? value : value;
        next.bathrooms = field === "standardSeats" ? value : value;
        const vip = parseSeatValue(next.vipSeats || next.bedrooms);
        const std = parseSeatValue(next.standardSeats || next.bathrooms);
        next.guests = (vip + std).toString();
      }

      if (field === "bedrooms") {
        next.vipSeats = value;
      }
      if (field === "bathrooms") {
        next.standardSeats = value;
      }
      if (field === "vipSeats") {
        next.bedrooms = value;
      }
      if (field === "standardSeats") {
        next.bathrooms = value;
      }

      return next;
    });
  };

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

  const handleOwnerSearch = async () => {
    const query = ownerSearch.trim();
    if (!query) {
      setOwnerResults([]);
      return;
    }
    setOwnerSearching(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.users)) {
        setOwnerResults(data.users);
      } else {
        setOwnerResults([]);
      }
    } catch {
      setOwnerResults([]);
    } finally {
      setOwnerSearching(false);
    }
  };

  const handleSelectOwner = (user: { id: string; firstName: string; cedula: string; email: string }) => {
    setOwnerSelected(user);
    setOwnerSearch("");
    setOwnerResults([]);
    setFormData((prev) => ({ ...prev, privateOwnerId: user.id }));
  };

  const handleClearOwner = () => {
    setOwnerSelected(null);
    setFormData((prev) => ({ ...prev, privateOwnerId: "" }));
  };

  const handleTogglePrivate = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPrivate: checked }));
    if (!checked) {
      setOwnerSelected(null);
      setOwnerResults([]);
      setOwnerSearch("");
    }
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

      const vipSeats = parseSeatValue(formData.vipSeats || formData.bedrooms);
      const standardSeats = parseSeatValue(formData.standardSeats || formData.bathrooms);

      if (vipSeats <= 0 && standardSeats <= 0) {
        throw new Error("Debes configurar cupos en VIP, Estándar o ambos");
      }

      const standardPrice = Number(formData.price);
      if (
        standardSeats > 0 &&
        (formData.price.trim().length === 0 || Number.isNaN(standardPrice) || standardPrice <= 0)
      ) {
        throw new Error("Si configuras cupos Estándar debes indicar un precio Estándar mayor a 0");
      }

      const vipPrice = Number(formData.priceVip);
      if (
        vipSeats > 0 &&
        (formData.priceVip.trim().length === 0 || Number.isNaN(vipPrice) || vipPrice <= 0)
      ) {
        throw new Error("Si configuras cupos VIP debes indicar un precio VIP mayor a 0");
      }



      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("guests", (vipSeats + standardSeats).toString());
      payload.append("bedrooms", vipSeats.toString());
      payload.append("bathrooms", standardSeats.toString());
      payload.append("country", formData.country);
      payload.append("municipality", formData.municipality);
      payload.append("exactAddress", formData.exactAddress);
      payload.append("checkInTime", formData.checkInTime);
      payload.append("contactNumber", formData.contactNumber);
      if (formData.latitude) payload.append("latitude", formData.latitude);
      if (formData.longitude) payload.append("longitude", formData.longitude);
      payload.append("price", standardSeats > 0 ? formData.price : "");
      payload.append("priceVip", vipSeats > 0 ? formData.priceVip : "");
      payload.append("vipSeats", vipSeats.toString());
      payload.append("standardSeats", standardSeats.toString());

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

      payload.append("isPrivate", formData.isPrivate ? "true" : "false");
      if (formData.isPrivate && formData.privateOwnerId) {
        payload.append("privateOwnerId", formData.privateOwnerId);
      }

      payload.append("transportType", formData.transportType || "ENC32");

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

  function TransportPreview({ transportType, vipSeats, standardSeats: stdSeats, capacity }: { transportType: string; vipSeats: number; standardSeats: number; capacity: number }) {
    const rows = useMemo(() => {
      const layouts: Record<string, { row: number; left: string[]; right: string[]; hasAisle: boolean }[]> = {
        ENC32: [
          { row: 1, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 2, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 3, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 4, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 5, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 6, left: ["A","B"], right: ["C","D"], hasAisle: true },
          { row: 7, left: ["A","B"], right: [], hasAisle: false },
          { row: 8, left: ["A","B","C","D","E"], right: [], hasAisle: false },
        ],
        VAN20: [
          { row: 1, left: ["A","B","C"], right: [], hasAisle: false },
          { row: 2, left: ["A","B","C"], right: [], hasAisle: false },
          { row: 3, left: ["A","B","C"], right: [], hasAisle: false },
          { row: 4, left: ["A","B","C"], right: [], hasAisle: false },
          { row: 5, left: ["A","B","C"], right: [], hasAisle: false },
          { row: 6, left: ["A","B","C","D"], right: [], hasAisle: false },
        ],
        VAN20_PASILLO: [
          { row: 1, left: ["A","B"], right: ["C"], hasAisle: true },
          { row: 2, left: ["A","B"], right: ["C"], hasAisle: true },
          { row: 3, left: ["A","B"], right: ["C"], hasAisle: true },
          { row: 4, left: ["A","B"], right: ["C"], hasAisle: true },
          { row: 5, left: ["A","B"], right: ["C"], hasAisle: true },
          { row: 6, left: ["A","B","C","D"], right: [], hasAisle: false },
        ],
      };
      return (layouts[transportType] || layouts.ENC32).map((rowDef) => {
        const allCols = [...rowDef.left, ...rowDef.right];
        let idx = 0;
        const seatEls: { col: string; isVip: boolean }[] = allCols.map((col) => {
          const isVip = idx < parseSeatValue(formData.vipSeats || formData.bedrooms);
          idx++;
          return { col, isVip };
        });
        return { ...rowDef, seats: seatEls };
      });
    }, [transportType, formData.vipSeats, formData.bedrooms]);

    const totalColors = [`${capacity} cupos`];

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {TRANSPORT_LABELS[transportType] || transportType}
        </div>

        <div className="relative bg-white border-2 border-gray-600 rounded-2xl px-3 py-2 flex flex-col items-center gap-1.5 shadow-sm">
          <div className="w-8 h-1.5 bg-gray-400 rounded-b-sm" />

          <div className="flex items-center gap-3 mb-1">
            <div className="w-4 h-4 rounded-full border border-gray-400 bg-gray-100" />
            <div className="w-4 h-4 rounded border border-gray-400 bg-gray-200 flex items-center justify-center">
              <span className="text-[5px] font-bold text-gray-500">01</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {rows.map((rowDef) => (
              <div key={rowDef.row} className={`flex items-center ${rowDef.hasAisle ? 'w-[76px]' : 'gap-1'}`}>
                {rowDef.hasAisle ? (
                  <>
                    <div className="flex items-center gap-1">
                      {rowDef.left.map((col) => {
                        const seat = rowDef.seats.find((s) => s.col === col);
                        const isVip = seat?.isVip ?? false;
                        return (
                          <div
                            key={`${rowDef.row}-${col}`}
                            className={`w-4 h-4 rounded-sm border text-[5px] font-bold flex items-center justify-center ${
                              isVip
                                ? "bg-gray-900 border-gray-700 text-white"
                                : "bg-white border-gray-300 text-gray-500"
                            }`}
                          >
                            {col}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-gray-200 rounded-full" />
                    </div>
                    {rowDef.right.map((col) => {
                      const seat = rowDef.seats.find((s) => s.col === col);
                      const isVip = seat?.isVip ?? false;
                      return (
                        <div
                          key={`${rowDef.row}-${col}`}
                          className={`w-4 h-4 rounded-sm border text-[5px] font-bold flex items-center justify-center ${
                            isVip
                              ? "bg-gray-900 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-500"
                          }`}
                        >
                          {col}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {rowDef.left.map((col) => {
                      const seat = rowDef.seats.find((s) => s.col === col);
                      const isVip = seat?.isVip ?? false;
                      return (
                        <div
                          key={`${rowDef.row}-${col}`}
                          className={`w-4 h-4 rounded-sm border text-[5px] font-bold flex items-center justify-center ${
                            isVip
                              ? "bg-gray-900 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-500"
                          }`}
                        >
                          {col}
                        </div>
                      );
                    })}
                    {rowDef.right.map((col) => {
                      const seat = rowDef.seats.find((s) => s.col === col);
                      const isVip = seat?.isVip ?? false;
                      return (
                        <div
                          key={`${rowDef.row}-${col}`}
                          className={`w-4 h-4 rounded-sm border text-[5px] font-bold flex items-center justify-center ${
                            isVip
                              ? "bg-gray-900 border-gray-700 text-white"
                              : "bg-white border-gray-300 text-gray-500"
                          }`}
                        >
                          {col}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[9px] text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-900 border border-gray-700" />
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-white border border-gray-300" />
            <span>Std</span>
          </div>
          <div className="text-gray-400 font-semibold">{totalColors.join(" · ")}</div>
        </div>
      </div>
    );
  }

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
                            : "border-border hover:border-border"
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
                onClick={() =>
                  wrapDescriptionSelection("[center]", "[/center]", "texto centrado")
                }
              >
                Centrar
              </Button>
            </div>
            <Textarea
              ref={descriptionRef}
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={
                missingDescription
                  ? "Falta completar la descripción"
                  : "Descripción de la Paquete. Usa **texto** para negrita y [center]texto[/center] para centrar"
              }
              className={missingDescription ? requiredMissingClass : undefined}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Formato básico: **texto** para negrita y [center]texto[/center] para centrar una línea.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Transporte</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="transportType">Tipo de Transporte</Label>
                  <Select
                    value={formData.transportType || "ENC32"}
                    onValueChange={(value) => handleChange("transportType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENC32">Encava 32 (31 pasajeros + copiloto)</SelectItem>
                      <SelectItem value="VAN20">Van 20 (19 pasajeros + copiloto)</SelectItem>
                      <SelectItem value="VAN20_PASILLO">Van 20 Pasillo (19 pasajeros + copiloto)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.transportType === "VAN20"
                      ? "Distribución: Filas 1-5 con 3 asientos (A,B,C), Fila 6 con 4 asientos (A,B,C,D)"
                      : formData.transportType === "VAN20_PASILLO"
                      ? "Distribución: Filas 1-5 con 2 asientos izq + pasillo + 1 der (A,B|C), Fila 6 con 4 asientos (A,B,C,D)"
                      : "Distribución: Filas 1-6 con 4 asientos, Fila 7 con 2 asientos, Fila 8 con 5 asientos"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vipSeats">Zona VIP (referencia)</Label>
                    <Input
                      id="vipSeats"
                      type="number"
                      value={formData.vipSeats}
                      onChange={(e) => handleChange("vipSeats", e.target.value)}
                      min={0}
                      placeholder="Asientos VIP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="standardSeats">Zona Estándar (referencia)</Label>
                    <Input
                      id="standardSeats"
                      type="number"
                      value={formData.standardSeats}
                      onChange={(e) => handleChange("standardSeats", e.target.value)}
                      min={0}
                      placeholder="Asientos Estándar"
                    />
                  </div>
                </div>
              </div>

              <TransportPreview
                transportType={formData.transportType || "ENC32"}
                vipSeats={parseSeatValue(formData.vipSeats || formData.bedrooms)}
                standardSeats={parseSeatValue(formData.standardSeats || formData.bathrooms)}
                capacity={TRANSPORT_CAPACITY[formData.transportType || "ENC32"] || 31}
              />
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
                <Label
                  htmlFor="priceVip"
                  className={missingPriceVip ? "text-red-600" : undefined}
                >
                  Precio del Paquete VIP
                </Label>
                <Input
                  id="priceVip"
                  type="number"
                  value={formData.priceVip}
                  onChange={(e) => handleChange("priceVip", e.target.value)}
                  min={1}
                  placeholder={
                    missingPriceVip
                      ? "Falta completar precio VIP"
                      : "Precio del Paquete VIP (obligatorio si hay cupos VIP)"
                  }
                  className={missingPriceVip ? requiredMissingClass : undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">
                  Los cupos VIP y Estándar se configuran en la sección "Características".
                </p>
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

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-lg font-semibold mb-3 text-amber-900">Paquete Privado</h3>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => handleTogglePrivate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <Label htmlFor="isPrivate" className="cursor-pointer text-amber-900">
                Este paquete es privado (solo el dueño puede verlo)
              </Label>
            </div>

            {formData.isPrivate && (
              <div className="space-y-3 mt-3">
                <p className="text-sm text-amber-800">
                  Busca al usuario que será el dueño de este paquete privado. Solo él podrá ver esta fecha cuando esté logueado.
                </p>

                {ownerSelected ? (
                  <div className="flex items-center justify-between bg-white rounded-lg border border-amber-200 p-3">
                    <div>
                      <p className="font-medium text-gray-800">{ownerSelected.firstName}</p>
                      <p className="text-sm text-gray-500">
                        {ownerSelected.cedula && `Cédula: ${ownerSelected.cedula}`}
                        {ownerSelected.email && ` · ${ownerSelected.email}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearOwner}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar por nombre, cédula o email..."
                        value={ownerSearch}
                        onChange={(e) => {
                          setOwnerSearch(e.target.value);
                          setOwnerResults([]);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleOwnerSearch();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOwnerSearch}
                        disabled={ownerSearching}
                      >
                        {ownerSearching ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>

                    {ownerResults.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {ownerResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectOwner(user)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-sm text-gray-800">{user.firstName}</p>
                            <p className="text-xs text-gray-500">
                              {user.cedula && `Cédula: ${user.cedula}`}
                              {user.email && ` · ${user.email}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
            <Label htmlFor="image">Imagen del Paquete</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Proporción recomendada <span className="font-semibold text-foreground">3:2</span> — medida ideal{" "}
              <span className="font-semibold text-foreground">960 × 640 px</span> (mín. 480 × 320 px). La imagen se mostrará centrada y recortada desde arriba.
            </p>
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



