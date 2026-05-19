"use client";

import React, { useState } from "react";
import Link from "next/link";

type PropertyType = {
  id: number;
  name: string;
  icon: string | null;
};

interface CategoriesClientProps {
  initialCategories: PropertyType[];
}

export default function CategoriesClient({
  initialCategories,
}: CategoriesClientProps) {
  const [categories, setCategories] = useState<PropertyType[]>(initialCategories);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCategories() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/property-types", {
        cache: "no-store",
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => null);
        throw new Error(responseBody?.error || "No se pudieron cargar las categorías");
      }

      const data: PropertyType[] = await response.json();
      setCategories(data || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No se pudieron cargar las categorías"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("El nombre de la categoría es obligatorio");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/property-types", {
        method: "POST",
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
        throw new Error(responseBody?.error || "No se pudo crear la categoría");
      }

      setName("");
      setIcon("");
      await fetchCategories();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear la categoría"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Categorías</h1>
      <p className="text-gray-600 mb-6">
        Administra las categorías de Paquete. Aquí podrás ver, crear y editar categorías.
      </p>

      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Crear nueva categoría</h2>
        <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="border rounded px-3 py-2"
            disabled={saving}
          />
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Icono (opcional, ej: home)"
            className="border rounded px-3 py-2"
            disabled={saving}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Crear categoría"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow p-4">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p>Cargando...</p>
        ) : categories.length === 0 ? (
          <p>No hay categorías registradas.</p>
        ) : (
          <ul>
            {categories.map((cat) => (
              <li key={cat.id} className="py-2 border-b flex items-center justify-between">
                <span>
                  <span className="font-semibold mr-2">{cat.name}</span>
                  {cat.icon && <span className="text-gray-400">({cat.icon})</span>}
                </span>
                <Link
                  href={`/admin/categories/${cat.id}`}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                >
                  Ver/Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


