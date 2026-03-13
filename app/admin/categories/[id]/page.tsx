"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type PropertyType = {
  id: number;
  name: string;
  icon: string | null;
};

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryIdParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null;
  const [category, setCategory] = useState<PropertyType | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async (id: number) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/property-types/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || "No se pudo cargar la categoría");
      }

      const data: PropertyType = await response.json();
      setCategory(data);
      setName(data.name || "");
      setIcon(data.icon || "");
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudo cargar la categoría"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (categoryId) {
      void fetchCategory(categoryId);
      return;
    }

    setLoading(false);
    setError("ID de categoría inválido");
  }, [categoryId, fetchCategory]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!categoryId) {
      setError("ID de categoría inválido");
      return;
    }

    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/property-types/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          icon,
        }),
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || "No se pudo actualizar la categoría");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No se pudo actualizar la categoría"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    if (!categoryId) {
      setError("ID de categoría inválido");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/property-types/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || "No se pudo eliminar la categoría");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se pudo eliminar la categoría"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (!category && !error) {
    return <div className="p-8">Categoría no encontrada.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Editar Categoría</h1>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-4 max-w-md">
        <label className="font-semibold">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
          disabled={saving}
        />
        <label className="font-semibold">Icono (opcional)</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="border rounded px-3 py-2"
          disabled={saving}
        />
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleDelete}
            disabled={saving}
          >
            Eliminar categoría
          </button>
        </div>
      </form>
    </div>
  );
}