"use client";
import React, { useEffect, useState } from "react";
import BannerForm from "./BannerForm";
import BannerList, { Banner } from "./BannerList";

interface BannersClientProps {
  userId: string;
}

export default function BannersClient({ userId }: BannersClientProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  async function fetchBanners() {
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      setError("Error al cargar banners");
    }
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    
    formData.append("createdById", userId);
    
    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : "/api/admin/banners";
      
      const method = editingBanner ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error del servidor:", errorData);
        setError(errorData.error || `Error al ${editingBanner ? "actualizar" : "crear"} banner`);
      } else {
        await fetchBanners();
        setEditingBanner(null);
        setError(null);
      }
    } catch (err) {
      console.error("Error en la petición:", err);
      setError(`Error al ${editingBanner ? "actualizar" : "crear"} banner`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(bannerId: string) {
    setError(null);
    
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Error al eliminar banner");
      } else {
        await fetchBanners();
      }
    } catch (err) {
      setError("Error al eliminar banner");
    }
  }

  function handleEdit(banner: Banner) {
    setEditingBanner(banner);
    setError(null);
    // Scroll al formulario
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingBanner(null);
    setError(null);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Gestión de Banners</h1>
      
      <BannerForm 
        onSubmit={handleSubmit} 
        loading={loading}
        banner={editingBanner}
        onCancel={handleCancelEdit}
      />
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
          {error}
        </div>
      )}
      
      <BannerList 
        banners={banners}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
