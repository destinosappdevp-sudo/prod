"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "GUEST" | "HOST" | "ADMIN" | "SUPERADMIN";
  _count?: {
    Home: number;
    Favorite: number;
    Reservation: number;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ [key: string]: string }>({});
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    // Esta verificación se hace en el servidor
    // Por ahora confiamos en que solo admins acceden aquí
    setIsAdmin(true);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/");
          return;
        }
        throw new Error("Error fetching users");
      }
      const data = await response.json();
      setUsers(data);
      // Inicializar roles seleccionados
      const roles: { [key: string]: string } = {};
      data.forEach((user: User) => {
        roles[user.id] = user.role;
      });
      setSelectedRole(roles);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating({ ...updating, [userId]: true });
    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!response.ok) throw new Error("Error updating role");

      setSelectedRole({ ...selectedRole, [userId]: newRole });
      setUsers(
        users.map((user) =>
          user.id === userId
            ? { ...user, role: newRole as User["role"] }
            : user
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar el rol");
    } finally {
      setUpdating({ ...updating, [userId]: false });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">No tienes acceso a esta página</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🔐 Panel de Administración</h1>
        <p className="text-gray-600 mb-8">
          Gestiona usuarios, roles y propiedades de Zerkka
        </p>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm">Total de Usuarios</h3>
            <p className="text-3xl font-bold">{users.length}</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm">Anfitriones (HOST)</h3>
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "HOST").length}
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-gray-600 text-sm">Administradores</h3>
            <p className="text-3xl font-bold">
              {users.filter((u) => u.role === "ADMIN" || u.role === "SUPERADMIN")
                .length}
            </p>
          </Card>
        </div>

        {/* Tabla de usuarios */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Propiedades
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Favoritos
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Reservas
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-3">
                      <Select
                        value={selectedRole[user.id] || user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value)
                        }
                        disabled={updating[user.id] || user.role === "SUPERADMIN"}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GUEST">Guest</SelectItem>
                          <SelectItem value="HOST">Host</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          {user.role === "SUPERADMIN" && (
                            <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-3 text-center font-semibold">
                      {user._count?.Home || 0}
                    </td>
                    <td className="px-6 py-3 text-center font-semibold">
                      {user._count?.Favorite || 0}
                    </td>
                    <td className="px-6 py-3 text-center font-semibold">
                      {user._count?.Reservation || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
