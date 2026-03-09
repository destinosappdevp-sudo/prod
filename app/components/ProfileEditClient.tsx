"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "../action";
import { Mail, Calendar, Upload } from "lucide-react";
import DocumentsSection, { UserDocumentItem } from "./DocumentsSection";

interface ProfileEditClientProps {
  userData: any;
  userId: string;
  initialDocs?: UserDocumentItem[];
}

export default function ProfileEditClient({ userData, userId, initialDocs = [] }: ProfileEditClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(true); // Siempre inicia en modo edición

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(userData);
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

  const getVerificationLabel = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente de revisión";
      case "APPROVED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      default:
        return "No enviado";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const form = new FormData();
    form.append("firstName", formData.firstName);
    form.append("lastName", formData.lastName);
    form.append("phoneNumber", formData.phoneNumber);
    form.append("currentProfileImage", currentUserData?.profileImage || "");
    form.append("currentDocument1Image", currentUserData?.document1Image || "");
    form.append("currentDocument2Image", currentUserData?.document2Image || "");
    
    if (selectedFile) {
      form.append("profileImage", selectedFile);
    }

    try {
      const result = await updateProfile(form);

      if (result.success && result.user) {
        const updatedData = { ...currentUserData, ...result.user };
        setCurrentUserData(updatedData);
        setFormData({
          firstName: updatedData?.firstName || "",
          lastName: updatedData?.lastName || "",
          phoneNumber: updatedData?.phoneNumber || "",
        });
        setSuccess(true);
        // Ya no volvemos al modo no-edición, mantenemos el formulario visible
        setPreviewImage(null);
        setSelectedFile(null);
        router.refresh();
      } else {
        setError(result.error || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      setError(error instanceof Error ? error.message : "Error desconocido al actualizar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const displayImage = previewImage || currentUserData?.profileImage || "/avatar-default.svg";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        {!isEditing && (
          <Button
            onClick={() => {
              setIsEditing(true);
              setError(null);
              setSuccess(false);
            }}
          >
            Editar Perfil
          </Button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-6">
          <p className="text-sm text-green-800">✓ Cambios guardados exitosamente</p>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 mb-6">
          <div className="space-y-6">
            {/* Mensaje de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
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

            {currentUserData?.role === "HOST" && (
              <div className="rounded-lg border p-4 bg-gray-50">
                <p className="text-sm font-semibold">Estado de verificación</p>
                <p className="text-sm text-gray-700 mt-1">
                  {getVerificationLabel(currentUserData?.verificationStatus)}
                </p>
                {currentUserData?.verificationReason && (
                  <p className="text-xs text-gray-500 mt-1">{currentUserData.verificationReason}</p>
                )}
              </div>
            )}

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
                value={currentUserData?.email}
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
                  router.push('/my-dashboard');
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
                src={currentUserData?.profileImage || "/avatar-default.svg"}
                alt={`${currentUserData?.firstName} ${currentUserData?.lastName}`}
                width={120}
                height={120}
                className="rounded-full border-4 border-gray-200"
              />
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">
                {currentUserData?.firstName} {currentUserData?.lastName}
              </h2>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                <span>{currentUserData?.email}</span>
              </div>

              {currentUserData?.phoneNumber && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <span>📞</span>
                  <span>{currentUserData?.phoneNumber}</span>
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

      {/* Sección de documentos — visible siempre, independiente del modo edición */}
      <div className="mt-6">
        <DocumentsSection initialDocs={initialDocs} readOnly={false} />
      </div>
    </div>
  );
}
