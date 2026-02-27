"use client";
import React, { useState } from "react";

interface BannerFormProps {
  onSubmit: (data: FormData) => void;
  loading?: boolean;
}

export default function BannerForm({ onSubmit, loading }: BannerFormProps) {
  const [image, setImage] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (image) {
      formData.append("image", image);
    }
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium">Título</label>
        <input name="title" required className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Fecha inicio</label>
        <input name="startDate" type="date" required className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Fecha fin</label>
        <input name="endDate" type="date" required className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">URL destino</label>
        <input name="url" className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Teléfono cliente</label>
        <input name="clientPhone" className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Email cliente</label>
        <input name="clientEmail" type="email" className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Costo</label>
        <input name="cost" type="number" step="0.01" className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium">Imagen</label>
        <input name="image" type="file" accept="image/*" required onChange={handleFileChange} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "Guardando..." : "Guardar banner"}
      </button>
    </form>
  );
}
