"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "GUEST" | "HOST" | "ADMIN" | "SUPERADMIN" | "BANER";
  isVerified?: boolean;
  verificationStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  verificationReason?: string | null;
  verifiedAt?: Date | null;
  document1Image?: string | null;
  document2Image?: string | null;
  _count?: {
    Home: number;
    Favorite: number;
    Reservation: number;
  };
}

interface EditUserClientProps {
  user: User;
}

export function EditUserClient({ user }: EditUserClientProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified || false,
    verificationStatus: user.verificationStatus || "NOT_SUBMITTED",
    verificationReason: user.verificationReason || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar usuario");
      }

      alert("Usuario actualizado correctamente");
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatusBadge = () => {
    const colors = {
      APPROVED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      REJECTED: "bg-red-100 text-red-700",
      NOT_SUBMITTED: "bg-gray-100 text-gray-700",
    };
    const labels = {
      APPROVED: "Aprobado",
      PENDING: "Pendiente",
      REJECTED: "Rechazado",
      NOT_SUBMITTED: "No enviado",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[formData.verificationStatus]}`}>
        {labels[formData.verificationStatus]}
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header con botón volver */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button type="button" variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Volver
          </Button>
        </Link>
        <Button type="submit" disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Información básica */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Información Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
        </div>
      </Card>

      {/* Rol y permisos */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Rol y Permisos</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as User["role"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GUEST">Guest</SelectItem>
                <SelectItem value="HOST">Host</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Propiedades</p>
              <p className="text-2xl font-bold">{user._count?.Home || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Favoritos</p>
              <p className="text-2xl font-bold">{user._count?.Favorite || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Reservas</p>
              <p className="text-2xl font-bold">{user._count?.Reservation || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Verificación (solo para HOSTs) */}
      {(user.role === "HOST" || formData.role === "HOST") && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Verificación de Host</h2>
          
          <div className="space-y-6">
            {/* Estado actual */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm text-gray-600">Estado actual</p>
                <div className="mt-2">{getVerificationStatusBadge()}</div>
              </div>
              {user.verifiedAt && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Verificado el</p>
                  <p className="text-sm font-medium">
                    {new Date(user.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Toggle de verificación */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isVerified" className="text-base font-medium">
                  Usuario Verificado
                </Label>
                <p className="text-sm text-gray-600">
                  Los usuarios verificados publican propiedades sin revisión
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    isVerified: !formData.isVerified,
                    verificationStatus: !formData.isVerified
                      ? "APPROVED"
                      : "NOT_SUBMITTED",
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isVerified ? "bg-green-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isVerified ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Estado de verificación */}
            <div>
              <Label htmlFor="verificationStatus">Estado de Verificación</Label>
              <Select
                value={formData.verificationStatus}
                onValueChange={(value: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED") =>
                  setFormData({
                    ...formData,
                    verificationStatus: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_SUBMITTED">No enviado</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Razón de verificación */}
            <div>
              <Label htmlFor="verificationReason">Razón / Comentarios</Label>
              <Textarea
                id="verificationReason"
                value={formData.verificationReason}
                onChange={(e) =>
                  setFormData({ ...formData, verificationReason: e.target.value })
                }
                placeholder="Ej: Verificado manualmente por el administrador, Documento aprobado, etc."
                rows={3}
              />
            </div>

            {/* Documentos cargados */}
            {(user.document1Image || user.document2Image) && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Documentos Cargados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.document1Image && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Documento 1</p>
                      <a
                        href={user.document1Image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} />
                        Ver documento
                      </a>
                      <div className="mt-2 relative h-40 w-full">
                        <Image
                          src={user.document1Image}
                          alt="Documento 1"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                  {user.document2Image && (
                    <div className="border rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Documento 2</p>
                      <a
                        href={user.document2Image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} />
                        Ver documento
                      </a>
                      <div className="mt-2 relative h-40 w-full">
                        <Image
                          src={user.document2Image}
                          alt="Documento 2"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Botón de guardar al final */}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} size="lg">
          <Save size={16} className="mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
