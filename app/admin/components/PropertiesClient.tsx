"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Home, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { normalizeCategoryNames } from "@/app/lib/property-categories";

type PublishStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

const STATUS_LABELS: Record<PublishStatus, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Activa",
  REJECTED: "Inactiva",
};

const STATUS_STYLES: Record<PublishStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_SELECT_STYLES: Record<PublishStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-300",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 border-yellow-300",
  APPROVED: "bg-green-100 text-green-700 border-green-300",
  REJECTED: "bg-red-100 text-red-700 border-red-300",
};

interface Property {
  id: string;
  title: string | null;
  price: number | null;
  country: string | null;
  municipality: string | null;
  categoryName: string[] | null;
  addedCategory: boolean;
  addedDescription: boolean;
  addedLocation: boolean;
  addedAmenities?: boolean;
  publishStatus?: PublishStatus | null;
  User?: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  _count: {
    Reservation: number;
    Favorite: number;
  };
}

const PAGE_SIZE = 10;

export function PropertiesClient({ properties }: { properties: Property[] }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState<Record<string, PublishStatus>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const getStatus = (p: Property): PublishStatus =>
    statuses[p.id] ?? (p.publishStatus as PublishStatus) ?? "DRAFT";

  const handleStatusChange = async (id: string, next: PublishStatus) => {
    setUpdating((u) => ({ ...u, [id]: true }));
    setStatuses((s) => ({ ...s, [id]: next }));
    try {
      await fetch(`/api/admin/properties/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishStatus: next }),
      });
    } catch {
      // revert on error
      setStatuses((s) => { const c = { ...s }; delete c[id]; return c; });
    } finally {
      setUpdating((u) => { const c = { ...u }; delete c[id]; return c; });
    }
  };

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    const normalizedCategories = normalizeCategoryNames(p.categoryName).map((item) =>
      item.toLowerCase()
    );
    return (
      (p.title?.toLowerCase().includes(q) ?? false) ||
      (p.User?.email?.toLowerCase().includes(q) ?? false) ||
      (p.User?.firstName?.toLowerCase().includes(q) ?? false) ||
      (p.User?.lastName?.toLowerCase().includes(q) ?? false) ||
      normalizedCategories.some((item) => item.includes(q))
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const statsTotal = properties.length;
  const statsActive = properties.filter((p) => getStatus(p) === "APPROVED").length;
  const statsPending = properties.filter((p) => getStatus(p) === "PENDING_APPROVAL").length;
  const statsDraft = properties.filter((p) => getStatus(p) === "DRAFT").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Home className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{statsTotal}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold">{statsActive}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold">{statsPending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <XCircle className="text-gray-500" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Borrador</p>
              <p className="text-2xl font-bold">{statsDraft}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Buscador */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar por título, anfitrión o categoría..."
            value={search}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paquete
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anfitrión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Favoritos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((property) => {
                const normalizedCategories = normalizeCategoryNames(property.categoryName);
                const categoryLabel =
                  normalizedCategories.length > 0
                    ? normalizedCategories.length > 1
                      ? `${normalizedCategories[0]} +${normalizedCategories.length - 1}`
                      : normalizedCategories[0]
                    : "Sin categoría";

                return (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {property.title || "Sin título"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {property.country
                          ? getStateByValue(property.country)?.label
                          : "Sin ubicación"}
                        {property.country && property.municipality
                          ? ` - ${getMunicipalityByValue(property.country, property.municipality)?.label}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {property.User?.firstName} {property.User?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{property.User?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                        {categoryLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">
                        {property.price ? `$${property.price}` : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property._count.Reservation}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property._count.Favorite}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <select
                        value={getStatus(property)}
                        onChange={(e) => handleStatusChange(property.id, e.target.value as PublishStatus)}
                        disabled={!!updating[property.id]}
                        className={`text-xs font-medium rounded-full px-2 py-1 border cursor-pointer focus:outline-none transition-colors ${
                          STATUS_SELECT_STYLES[getStatus(property)]
                        } ${updating[property.id] ? "opacity-50 cursor-wait" : ""}`}
                      >
                        <option value="DRAFT">Borrador</option>
                        <option value="PENDING_APPROVAL">Pendiente</option>
                        <option value="APPROVED">Activa</option>
                        <option value="REJECTED">Inactiva</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/admin/properties/${property.id}`}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                      >
                        Ver/Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron Paquetes</p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-600">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} Paquetes
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
