"use client";
import React, { useEffect, useState } from "react";
import BannerForm from "./BannerForm";
import BannerList, { Banner } from "./BannerList";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchBanners() {
    const res = await fetch("/api/admin/banners");
    const data = await res.json();
    setBanners(data);
  }

  useEffect(() => {
    fetchBanners();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    // TODO: obtener el userId real del usuario autenticado
    formData.append("createdById", "user-id-placeholder");
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      setError("Error al crear banner");
    } else {
      fetchBanners();
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Banners</h1>
      <BannerForm onSubmit={handleSubmit} loading={loading} />
      {error && <p className="text-red-600 mt-2">{error}</p>}
      <BannerList banners={banners} />
    </div>
  );
}
