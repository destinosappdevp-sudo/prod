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
    cedula: userData?.cedula || "",
    dateOfBirth: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "",
    emergencyPhone: userData?.emergencyPhone || "",
    address: userData?.address || "",
    healthConditions: userData?.healthConditions || "",
    hasTraveledWithDestinos: userData?.hasTraveledWithDestinos || false,
    lastTravelDestination: userData?.lastTravelDestination || "",
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
    form.append("cedula", formData.cedula);
    form.append("dateOfBirth", formData.dateOfBirth);
    form.append("emergencyPhone", formData.emergencyPhone);
    form.append("address", formData.address);
    form.append("healthConditions", formData.healthConditions);
    form.append("hasTraveledWithDestinos", String(formData.hasTraveledWithDestinos));
    form.append("lastTravelDestination", formData.lastTravelDestination);
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
          cedula: updatedData?.cedula || "",
          dateOfBirth: updatedData?.dateOfBirth ? new Date(updatedData.dateOfBirth).toISOString().split('T')[0] : "",
          emergencyPhone: updatedData?.emergencyPhone || "",
          address: updatedData?.address || "",
          healthConditions: updatedData?.healthConditions || "",
          hasTraveledWithDestinos: updatedData?.hasTraveledWithDestinos || false,
          lastTravelDestination: updatedData?.lastTravelDestination || "",
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

            {false && (
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

            {/* Cédula */}
            <div>
              <Label htmlFor="cedula" className="text-sm font-medium">Número de Cédula</Label>
              <Input
                id="cedula"
                name="cedula"
                value={formData.cedula}
                onChange={handleInputChange}
                placeholder="V-12345678"
                className="mt-1"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-medium">Fecha de Nacimiento</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            {/* Teléfono de Emergencia */}
            <div>
              <Label htmlFor="emergencyPhone" className="text-sm font-medium">Teléfono de Emergencia</Label>
              <Input
                id="emergencyPhone"
                name="emergencyPhone"
                type="tel"
                value={formData.emergencyPhone}
                onChange={handleInputChange}
                placeholder="+58 412 1234567"
                className="mt-1"
              />
            </div>

            {/* Dirección de Habitación */}
            <div>
              <Label htmlFor="address" className="text-sm font-medium">Dirección de Habitación</Label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Calle, Avenida, Número, Piso, etc."
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Condiciones de Salud */}
            <div>
              <Label htmlFor="healthConditions" className="text-sm font-medium">Padece alguna enfermedad o lesión</Label>
              <p className="text-xs text-gray-500 mb-2">De ser afirmativo, especifique</p>
              <textarea
                id="healthConditions"
                name="healthConditions"
                value={formData.healthConditions}
                onChange={handleInputChange}
                placeholder="Describa su condición (opcional)"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Viajes con Destinos Venezuela */}
            <div>
              <div className="flex items-center gap-3">
                <input
                  id="hasTraveledWithDestinos"
                  name="hasTraveledWithDestinos"
                  type="checkbox"
                  checked={formData.hasTraveledWithDestinos}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="hasTraveledWithDestinos" className="text-sm font-medium cursor-pointer">
                  Ha viajado con Destinos Venezuela
                </Label>
              </div>
            </div>

            {/* Último Destino */}
            {formData.hasTraveledWithDestinos && (
              <div>
                <Label htmlFor="lastTravelDestination" className="text-sm font-medium">Especifique cuál destino</Label>
                <Input
                  id="lastTravelDestination"
                  name="lastTravelDestination"
                  value={formData.lastTravelDestination}
                  onChange={handleInputChange}
                  placeholder="Nombre del destino visitado"
                  className="mt-1"
                />
              </div>
            )}

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
