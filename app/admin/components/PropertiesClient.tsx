"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Home, CheckCircle, Clock, XCircle, CalendarCheck, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { getMunicipalityByValue } from "@/app/lib/venezuelaMunicipalities";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { normalizeCategoryNames } from "@/app/lib/property-categories";
import { ActiveReservationsTable } from "./ActiveReservationsTable";

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
  guests: string | null;
  checkInTime: string | null;
  savingsUsersCount: number;
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

type MainTab = "paquetes" | "reservas_activas";

export function PropertiesClient({
  properties,
  activeReservations = [],
}: {
  properties: Property[];
  activeReservations?: any[];
}) {
  const [mainTab, setMainTab] = useState<MainTab>("paquetes");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState<Record<string, PublishStatus>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [propertyList, setPropertyList] = useState<Property[]>(properties);

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

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `¿Está seguro que desea eliminar la propiedad "${title}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeleting((d) => ({ ...d, [id]: true }));
    try {
      const response = await fetch(`/api/admin/properties/${id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo eliminar la propiedad");
      }

      // Remove from list
      setPropertyList((list) => list.filter((p) => p.id !== id));
      alert("Propiedad eliminada correctamente");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar la propiedad");
    } finally {
      setDeleting((d) => { const c = { ...d }; delete c[id]; return c; });
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

  const statsTotal = propertyList.length;
  const statsActive = propertyList.filter((p) => getStatus(p) === "APPROVED").length;
  const statsPending = propertyList.filter((p) => getStatus(p) === "PENDING_APPROVAL").length;
  const statsDraft = propertyList.filter((p) => getStatus(p) === "DRAFT").length;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="flex border-b bg-white">
          <button
            type="button"
            onClick={() => setMainTab("paquetes")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors sm:flex-none sm:px-6 sm:py-4 ${
              mainTab === "paquetes"
                ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Paquetes
          </button>
          <button
            type="button"
            onClick={() => setMainTab("reservas_activas")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors sm:flex-none sm:px-6 sm:py-4 inline-flex items-center justify-center gap-2 ${
              mainTab === "reservas_activas"
                ? "border-b-2 border-blue-600 bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <CalendarCheck size={18} className="hidden sm:inline shrink-0" />
            Reservas Activas
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {activeReservations.length}
            </span>
          </button>
        </div>
      </Card>

      {mainTab === "reservas_activas" ? (
        <ActiveReservationsTable reservations={activeReservations} />
      ) : (
        <>
      {/* Botón nuevo paquete */}
      <div className="flex justify-end">
        <Link
          href="/admin/properties/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <PlusCircle size={18} />
          Nuevo Paquete
        </Link>
      </div>
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
            placeholder="Buscar por título, email o categoría..."
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
                  Fecha de salida
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cupos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservas
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuarios Ahorrando
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                        {property.checkInTime || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">
                        {property.guests || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property._count.Reservation}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{property.savingsUsersCount}</span>
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
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                        >
                          Ver/Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id, property.title || "Sin título")}
                          disabled={!!deleting[property.id] || !!updating[property.id]}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar propiedad"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
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
        </>
      )}
    </div>
  );
}
