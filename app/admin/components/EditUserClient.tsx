"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DocumentsSection, { UserDocumentItem } from "@/app/components/DocumentsSection";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  phoneNumber?: string | null;
  cedula?: string | null;
  dateOfBirth?: Date | string | null;
  emergencyPhone?: string | null;
  address?: string | null;
  healthConditions?: string | null;
  hasTraveledWithDestinos?: boolean;
  lastTravelDestination?: string | null;
  role: "GUEST" | "ADMIN" | "SUPERADMIN";
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
  documents?: UserDocumentItem[];
}

/** Rol mostrado en el selector: solo Usuario / Admin (GUEST / ADMIN). */
function roleToSelectValue(role: User["role"]): "GUEST" | "ADMIN" {
  if (role === "ADMIN" || role === "SUPERADMIN") return "ADMIN";
  return "GUEST";
}

export function EditUserClient({ user, documents = [] }: EditUserClientProps) {
  const router = useRouter();
  const initialFullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  const dateOfBirthValue = user.dateOfBirth
    ? new Date(user.dateOfBirth).toISOString().split("T")[0]
    : "";

  const [formData, setFormData] = useState({
    fullName: initialFullName,
    email: user.email,
    phoneNumber: user.phoneNumber || "",
    cedula: user.cedula || "",
    dateOfBirth: dateOfBirthValue,
    emergencyPhone: user.emergencyPhone || "",
    address: user.address || "",
    healthConditions: user.healthConditions || "",
    hasTraveledWithDestinos: user.hasTraveledWithDestinos || false,
    lastTravelDestination: user.lastTravelDestination || "",
    role: user.role,
    isVerified: user.isVerified || false,
    verificationStatus: user.verificationStatus || "NOT_SUBMITTED",
    verificationReason: user.verificationReason || "",
  });
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (passwordData.password.length < 8) {
      setPasswordMsg({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (passwordData.password !== passwordData.confirm) {
      setPasswordMsg({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    setChangingPassword(true);
    setPasswordMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordData.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Error");
      setPasswordMsg({
        type: "success",
        text: data.resolvedByEmail
          ? "Contraseña actualizada correctamente (registro legacy resuelto por email)."
          : "Contraseña actualizada correctamente.",
      });
      setPasswordData({ password: "", confirm: "" });
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Error al cambiar la contraseña." });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedFullName = formData.fullName.trim().replace(/\s+/g, " ");
    if (!normalizedFullName) {
      alert("Debes ingresar el nombre completo");
      return;
    }

    const [firstNamePart, ...lastNameParts] = normalizedFullName.split(" ");
    const payload = {
      ...formData,
      firstName: firstNamePart,
      lastName: lastNameParts.join(" ") || "-",
    };

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
          <div className="md:col-span-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Ej: Juan Perez"
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
          <div>
            <Label htmlFor="cedula">Cedula</Label>
            <Input
              id="cedula"
              value={formData.cedula}
              onChange={(e) =>
                setFormData({ ...formData, cedula: e.target.value })
              }
              placeholder="V-12345678"
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Telefono</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="0414-1234567"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) =>
                setFormData({ ...formData, dateOfBirth: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="emergencyPhone">Telefono de Emergencia</Label>
            <Input
              id="emergencyPhone"
              value={formData.emergencyPhone}
              onChange={(e) =>
                setFormData({ ...formData, emergencyPhone: e.target.value })
              }
              placeholder="0412-0000000"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Direccion completa"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="healthConditions">Condiciones de Salud</Label>
            <Input
              id="healthConditions"
              value={formData.healthConditions}
              onChange={(e) =>
                setFormData({ ...formData, healthConditions: e.target.value })
              }
              placeholder="Alergias, medicacion, restricciones, etc."
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.hasTraveledWithDestinos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasTraveledWithDestinos: e.target.checked,
                    lastTravelDestination: e.target.checked ? formData.lastTravelDestination : "",
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              Ha viajado con Destinos anteriormente
            </label>
          </div>
          {formData.hasTraveledWithDestinos && (
            <div className="md:col-span-2">
              <Label htmlFor="lastTravelDestination">Ultimo destino de viaje</Label>
              <Input
                id="lastTravelDestination"
                value={formData.lastTravelDestination}
                onChange={(e) =>
                  setFormData({ ...formData, lastTravelDestination: e.target.value })
                }
                placeholder="Ej: Merida, Mochima, Los Roques"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Rol y permisos */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Rol y Permisos</h2>
        <div className="space-y-4">
          {user.role !== "GUEST" && user.role !== "ADMIN" && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Rol actual en el sistema: <strong>{user.role}</strong>. Al elegir Usuario o Admin y
              guardar, se actualizará a ese rol.
            </p>
          )}
          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={roleToSelectValue(formData.role)}
              onValueChange={(value: "GUEST" | "ADMIN") =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GUEST">Usuario</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Paquetes</p>
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

      {/* Cambiar Contraseña */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <KeyRound size={20} className="text-gray-500" />
          Cambiar Contraseña
        </h2>
        <p className="text-sm text-gray-500 mb-4">Establece una nueva contraseña para este usuario. Mínimo 8 caracteres.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />
          </div>
        </div>

        {passwordMsg && (
          <div
            className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${
              passwordMsg.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword || !passwordData.password || !passwordData.confirm}
            variant="outline"
            className="border-gray-300"
          >
            <KeyRound size={15} className="mr-2" />
            {changingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </div>
      </Card>

      {/* Documentos del usuario */}
      <DocumentsSection initialDocs={documents} readOnly={true} />

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



