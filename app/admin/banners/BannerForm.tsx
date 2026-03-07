"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Banner } from "./BannerList";

interface BannerFormProps {
  onSubmit: (data: FormData) => void;
  loading?: boolean;
  banner?: Banner | null;
  onCancel?: () => void;
}

interface StorageImage {
  name: string;
  url: string;
  createdAt: string;
}

export default function BannerForm({ onSubmit, loading, banner, onCancel }: BannerFormProps) {
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [url, setUrl] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [cost, setCost] = useState("");
  const [uploadMode, setUploadMode] = useState<"upload" | "select">("upload");
  const [existingImages, setExistingImages] = useState<StorageImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [loadingImages, setLoadingImages] = useState(false);
  const [tipo, setTipo] = useState("HERO1");

  useEffect(() => {
    if (banner) {
      setTitle(banner.title);
      setStartDate(banner.startDate.split("T")[0]);
      setEndDate(banner.endDate.split("T")[0]);
      setUrl(banner.url || "");
      setClientPhone(banner.clientPhone || "");
      setClientEmail(banner.clientEmail || "");
      setCost(banner.cost?.toString() || "");
      setTipo(banner.tipo || "HERO1");
    } else {
      // Reset form
      setTitle("");
      setStartDate("");
      setEndDate("");
      setUrl("");
      setClientPhone("");
      setClientEmail("");
      setCost("");
      setImage(null);
      setSelectedImageUrl("");
      setUploadMode("upload");
      setTipo("HERO1");
    }
  }, [banner]);

  useEffect(() => {
    if (uploadMode === "select") {
      fetchExistingImages();
    }
  }, [uploadMode]);

  async function fetchExistingImages() {
    setLoadingImages(true);
    try {
      const response = await fetch("/api/admin/banners/images");
      const data = await response.json();
      setExistingImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoadingImages(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        alert("La imagen es muy grande. El tamaño máximo es 5MB.");
        e.target.value = ""; // Limpiar input
        return;
      }
      
      setImage(file);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validar que haya imagen en cualquier modo (crear nuevo)
    if (!banner) {
      if (uploadMode === "upload" && !image) {
        alert("Por favor selecciona una imagen para subir");
        return;
      }
      if (uploadMode === "select" && !selectedImageUrl) {
        alert("Por favor selecciona una imagen del archivo");
        return;
      }
    }
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Eliminar el campo image del FormData si existe (para evitar duplicados)
    formData.delete("image");
    
    // Asegurar que tipo esté en el formData
    formData.set("tipo", tipo);
    
    // Agregar la imagen según el modo
    if (uploadMode === "upload" && image) {
      formData.append("image", image);
    } else if (uploadMode === "select" && selectedImageUrl) {
      formData.append("existingImageUrl", selectedImageUrl);
    }
    
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">
        {banner ? "Editar Banner" : "Crear Nuevo Banner"}
      </h2>
      
      <div>
        <label className="block font-medium mb-1 text-sm">Título *</label>
        <input 
          name="title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
        />
      </div>

      <div>
        <label className="block font-medium mb-1 text-sm">Tipo de Banner *</label>
        <select
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
        >
          <option value="HERO1">Hero 1</option>
          <option value="HERO2">Hero 2</option>
          <option value="MEDIO1">Medio 1</option>
          <option value="MEDIO2">Medio 2</option>
          <option value="POP">POP</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-sm">Fecha inicio *</label>
          <input 
            name="startDate" 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm">Fecha fin *</label>
          <input 
            name="endDate" 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
          />
        </div>
      </div>
      
      <div>
        <label className="block font-medium mb-1 text-sm">URL destino</label>
        <input 
          name="url" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://ejemplo.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1 text-sm">Teléfono cliente</label>
          <input 
            name="clientPhone" 
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+58 424 1234567"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
          />
        </div>
        <div>
          <label className="block font-medium mb-1 text-sm">Email cliente</label>
          <input 
            name="clientEmail" 
            type="email" 
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="cliente@ejemplo.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
          />
        </div>
      </div>
      
      <div>
        <label className="block font-medium mb-1 text-sm">Costo (USD)</label>
        <input 
          name="cost" 
          type="number" 
          step="0.01" 
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
        />
      </div>
      
      <div>
        <label className="block font-medium mb-2 text-sm">
          Imagen {banner ? "(opcional - dejar vacío para mantener actual)" : "*"}
        </label>

        {/* Tabs para elegir modo */}
        <div className="flex gap-2 mb-3 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setUploadMode("upload")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "upload"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Subir nueva
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("select")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "select"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Seleccionar del archivo
          </button>
        </div>

        {/* Preview de imagen actual si está editando */}
        {banner && banner.imageUrl && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
            <Image
              src={banner.imageUrl}
              alt="Preview actual"
              width={150}
              height={80}
              unoptimized
              className="h-20 w-auto rounded border border-gray-200"
            />
          </div>
        )}

        {/* Modo: Subir nueva */}
        {uploadMode === "upload" && (
          <div>
            <input
              type="file"
              accept="image/*"
              required={!banner}
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: 400x200px (2:1). Máx: 5MB
            </p>
          </div>
        )}

        {/* Modo: Seleccionar existente */}
        {uploadMode === "select" && (
          <div className="border border-gray-300 rounded-lg p-4 max-h-80 overflow-y-auto">
            {loadingImages ? (
              <p className="text-gray-500 text-sm text-center py-4">
                Cargando imágenes...
              </p>
            ) : existingImages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay imágenes en el archivo. Sube la primera.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {existingImages.map((img) => (
                  <button
                    key={img.name}
                    type="button"
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`relative aspect-[2/1] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageUrl === img.url
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {selectedImageUrl === img.url && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-white rounded-full p-1">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedImageUrl && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                ✓ Imagen seleccionada
              </p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-3 pt-2">
        <button 
          type="submit" 
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={loading}
        >
          {loading ? "Guardando..." : banner ? "Actualizar Banner" : "Crear Banner"}
        </button>
        
        {(banner || onCancel) && (
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
