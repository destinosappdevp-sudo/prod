"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface AmenityCategory {
  id: string;
  name: string;
  order: number | null;
  isActive: boolean;
  Amenity: Amenity[];
}

interface Amenity {
  id: string;
  name: string;
  iconKey: string;
  iconUrl: string | null;
  isActive: boolean;
  categoryId: string | null;
}

interface AmenityManagerClientProps {
  initialCategories: AmenityCategory[];
}

export default function AmenityManagerClient({
  initialCategories,
}: AmenityManagerClientProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [amenityIconKey, setAmenityIconKey] = useState("");
  const [amenityIconUrl, setAmenityIconUrl] = useState("");
  const [amenityCategoryId, setAmenityCategoryId] = useState<string>(
    initialCategories[0]?.id || ""
  );

  const categoryOptions = useMemo(() => {
    return categories.filter((cat) => cat.isActive);
  }, [categories]);

  const refreshCategories = async () => {
    const response = await fetch("/api/admin/amenity-categories");
    if (!response.ok) return;
    const data = await response.json();

    const amenitiesResponse = await fetch("/api/admin/amenities");
    const amenities = amenitiesResponse.ok ? await amenitiesResponse.json() : [];

    const map: Record<string, Amenity[]> = {};
    amenities.forEach((amenity: Amenity) => {
      const key = amenity.categoryId || "uncategorized";
      map[key] = map[key] || [];
      map[key].push(amenity);
    });

    const merged = data.map((cat: AmenityCategory) => ({
      ...cat,
      Amenity: map[cat.id] || [],
    }));

    setCategories(merged);
    if (!amenityCategoryId && merged[0]?.id) {
      setAmenityCategoryId(merged[0].id);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    await fetch("/api/admin/amenity-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryName,
        order: categoryOrder ? Number(categoryOrder) : null,
      }),
    });
    setCategoryName("");
    setCategoryOrder("");
    await refreshCategories();
  };

  const handleCreateAmenity = async () => {
    if (!amenityName.trim() || !amenityIconKey.trim() || !amenityCategoryId) {
      alert("Completa nombre, clave de icono y selecciona un grupo.");
      return;
    }

    const res = await fetch("/api/admin/amenities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: amenityName,
        iconKey: amenityIconKey,
        iconUrl: amenityIconUrl,
        categoryId: amenityCategoryId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Error al crear el servicio: " + (err?.error || res.status));
      return;
    }

    setAmenityName("");
    setAmenityIconKey("");
    setAmenityIconUrl("");
    await refreshCategories();
  };

  const toggleCategoryActive = async (categoryId: string, isActive: boolean) => {
    await fetch(`/api/admin/amenity-categories/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await refreshCategories();
  };

  const toggleAmenityActive = async (amenityId: string, isActive: boolean) => {
    await fetch(`/api/admin/amenities/${amenityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await refreshCategories();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Grupos de servicios</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nombre</Label>
            <Input
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ej: Internet y oficina"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryOrder">Orden</Label>
            <Input
              id="categoryOrder"
              value={categoryOrder}
              onChange={(e) => setCategoryOrder(e.target.value)}
              placeholder="Ej: 1"
              type="number"
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleCreateCategory}>
              Crear grupo
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between border rounded-lg p-3"
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-gray-500">Orden: {category.order ?? "-"}</p>
              </div>
              <Button
                variant={category.isActive ? "secondary" : "outline"}
                onClick={() => toggleCategoryActive(category.id, category.isActive)}
              >
                {category.isActive ? "Desactivar" : "Activar"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Servicios</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amenityName">Nombre</Label>
            <Input
              id="amenityName"
              value={amenityName}
              onChange={(e) => setAmenityName(e.target.value)}
              placeholder="Ej: Wifi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenityIconKey">Icono (key)</Label>
            <Input
              id="amenityIconKey"
              value={amenityIconKey}
              onChange={(e) => setAmenityIconKey(e.target.value)}
              placeholder="Ej: wifi"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenityIconUrl">Icono (URL)</Label>
            <Input
              id="amenityIconUrl"
              value={amenityIconUrl}
              onChange={(e) => setAmenityIconUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenityCategory">Grupo de servicios</Label>
            <select
              id="amenityCategory"
              value={amenityCategoryId}
              onChange={(e) => setAmenityCategoryId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleCreateAmenity}>
              Crear servicio
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id} className="space-y-2">
              <h3 className="text-base font-semibold">{category.name}</h3>
              <div className="space-y-2">
                {category.Amenity.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{amenity.name}</p>
                      <p className="text-xs text-gray-500">{amenity.iconKey}</p>
                    </div>
                    <Button
                      variant={amenity.isActive ? "secondary" : "outline"}
                      onClick={() => toggleAmenityActive(amenity.id, amenity.isActive)}
                    >
                      {amenity.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
