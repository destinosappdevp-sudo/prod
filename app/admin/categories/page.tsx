"use client";
import React, { useEffect, useState } from "react";
// Ajusta la ruta según tu estructura real
import { supabase } from "../../lib/supabase";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_types")
      .select("*")
      .order("name", { ascending: true });
    setCategories(data || []);
    setLoading(false);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Categorías</h1>
      <p className="text-gray-600 mb-6">Administra las categorías de propiedad. Aquí podrás ver, crear y eliminar categorías.</p>
      <div className="bg-white rounded shadow p-4">
        {loading ? (
          <p>Cargando...</p>
        ) : categories.length === 0 ? (
          <p>No hay categorías registradas.</p>
        ) : (
          <ul>
            {categories.map(cat => (
              <li key={cat.id} className="py-2 border-b">
                <span className="font-semibold mr-2">{cat.name}</span>
                {cat.icon && <span className="text-gray-400">({cat.icon})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
