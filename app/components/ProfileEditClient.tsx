"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "../action";
import { Mail, Calendar, Upload } from "lucide-react";

interface ProfileEditClientProps {
  userData: any;
  userId: string;
}

export default function ProfileEditClient({ userData, userId }: ProfileEditClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || "",
    lastName: userData?.lastName || "",
    phoneNumber: userData?.phoneNumber || "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = new FormData();
    form.append("firstName", formData.firstName);
    form.append("lastName", formData.lastName);
    form.append("phoneNumber", formData.phoneNumber);
    form.append("currentProfileImage", userData?.profileImage || "");
    
    if (selectedFile) {
      form.append("profileImage", selectedFile);
    }

    try {
      const result = await updateProfile(form);
      if (result.success) {
        setIsEditing(false);
        setPreviewImage(null);
        setSelectedFile(null);
        // Realizar un refresh para ver los cambios
        window.location.reload();
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayImage = previewImage || userData?.profileImage || 
    "https://static.vecteezy.com/system/resources/previews/009/292/244/large_2x/default-avatar-icon-of-social-media-user-vector.jpg";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Editar Perfil
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 mb-6">
          <div className="space-y-6">
            {/* Foto de perfil */}
            <div>
              <Label className="text-base font-semibold mb-4 block">Foto de Perfil</Label>
              <div className="flex items-end gap-6">
                <div className="relative">
                  <Image
                    src={displayImage}
                    alt="Foto de perfil"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="profileImage" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    Cambiar foto
                  </Label>
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">JPG, PNG. Máx 5MB</p>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium">Nombre</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            {/* Apellido */}
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium">Apellido</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="phoneNumber" className="text-sm font-medium">Número Telefónico</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+58 412 1234567"
                className="mt-1"
              />
            </div>

            {/* Email (solo lectura) */}
            <div>
              <Label className="text-sm font-medium">Correo electrónico</Label>
              <Input
                value={userData?.email}
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setPreviewImage(null);
                  setSelectedFile(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Image
                src={userData?.profileImage || "https://static.vecteezy.com/system/resources/previews/009/292/244/large_2x/default-avatar-icon-of-social-media-user-vector.jpg"}
                alt={`${userData?.firstName} ${userData?.lastName}`}
                width={120}
                height={120}
                className="rounded-full border-4 border-gray-200"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">
                {userData?.firstName} {userData?.lastName}
              </h2>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                <span>{userData?.email}</span>
              </div>

              {userData?.phoneNumber && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <span>📞</span>
                  <span>{userData?.phoneNumber}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Miembro desde {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
