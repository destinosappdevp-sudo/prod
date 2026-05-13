"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  cedula?: string | null;
  profileImage?: string | null;
  role: "GUEST" | "ADMIN" | "SUPERADMIN";
  isVerified?: boolean;
  verificationStatus?: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  verificationReason?: string | null;
  document1Image?: string | null;
  document2Image?: string | null;
  savingsTotal?: number;
  _count?: {
    Favorite: number;
    Reservation: number;
  };
}

interface UserManagementClientProps {
  initialUsers: User[];
}

const PAGE_SIZE = 10;

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.cedula || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Error updating role");
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, role: newRole as User["role"] }
            : user
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al cambiar el rol");
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-red-100 text-red-700";
      case "ADMIN":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getVerificationLabel = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "APPROVED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      default:
        return "No enviado";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Buscar por nombre, email o cédula..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="GUEST">Usuarios</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SUPERADMIN">Superadmin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Usuarios</p>
          <p className="text-2xl font-bold">{users.filter((u) => u.role === "GUEST").length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Admins</p>
          <p className="text-2xl font-bold">
            {users.filter((u) => u.role === "ADMIN" || u.role === "SUPERADMIN").length}
          </p>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Favoritos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ahorros
                </th>                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verificación
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Editar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.profileImage && !user.profileImage.includes('avatar.vercel.sh') ? (
                          <Image
                            src={user.profileImage}
                            alt={`${user.firstName} ${user.lastName}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Cédula: {user.cedula || "No registrada"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold">{user._count?.Favorite || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold">{user._count?.Reservation || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-green-700">
                        ${(user.savingsTotal ?? 0).toFixed(2)}
                      </span>
                      <Link
                        href={`/admin/users/${user.id}/savings`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-400">N/A</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link 
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Edit size={16} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron usuarios</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} de {filteredUsers.length} usuarios
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-100"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-100"
            >
              ‹ Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`px-3 py-1 text-sm rounded border ${
                      currentPage === p
                        ? "bg-blue-600 text-white border-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm rounded border disabled:opacity-40 hover:bg-gray-100"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
