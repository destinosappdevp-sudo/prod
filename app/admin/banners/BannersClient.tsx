"use client";
import React, { useEffect, useState } from "react";
import BannerForm from "./BannerForm";
import BannerList, { Banner } from "./BannerList";

type Tab = "form" | "activos" | "inactivos";

interface BannersClientProps {
  userId: string;
}

export default function BannersClient({ userId }: BannersClientProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("form");

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

  const now = new Date();
  const activeBanners = banners.filter(
    (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now
  );
  const inactiveBanners = banners.filter(
    (b) => new Date(b.startDate) > now || new Date(b.endDate) < now
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "form", label: "Añadir Banner" },
    { key: "activos", label: "Banners Activos", count: activeBanners.length },
    { key: "inactivos", label: "Banners Inactivos", count: inactiveBanners.length },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Gestión de Publicidad</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-white border border-b-white border-gray-200 text-gray-900 -mb-px"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.key
                    ? "bg-gray-100 text-gray-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {activeTab === "form" && (
        <BannerForm
          onSubmit={handleSubmit}
          loading={loading}
          banner={editingBanner}
          onCancel={handleCancelEdit}
        />
      )}

      {activeTab === "activos" && (
        <BannerList
          banners={activeBanners}
          onEdit={(banner) => { handleEdit(banner); setActiveTab("form"); }}
          onDelete={handleDelete}
          emptyMessage="No hay banners activos en este momento."
        />
      )}

      {activeTab === "inactivos" && (
        <BannerList
          banners={inactiveBanners}
          onEdit={(banner) => { handleEdit(banner); setActiveTab("form"); }}
          onDelete={handleDelete}
          emptyMessage="No hay banners inactivos."
        />
      )}
    </div>
  );
}
