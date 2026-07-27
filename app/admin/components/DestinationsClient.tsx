"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Trash2, MapPin } from "lucide-react";
import { SupabaseImage } from "@/app/components/SupabaseImage";

export type DestinationItem = {
  id: string;
  title: string | null;
  subtitle: string | null;
  slug: string;
  photo: string | null;
  country: string | null;
  municipality: string | null;
  publishStatus: string;
  isExpired: boolean;
  _count: {
    Homes: number;
    Favorite: number;
    Review: number;
  };
};

interface DestinationsClientProps {
  destinations: DestinationItem[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  APPROVED: "Aprobado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  APPROVED: "default",
};

export function DestinationsClient({ destinations }: DestinationsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const matchesSearch =
        !search.trim() ||
        (d.title?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (d.subtitle?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (d.municipality?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (d.country?.toLowerCase().includes(search.toLowerCase()) ?? false);
      if (statusFilter === "ALL") return matchesSearch;
      if (statusFilter === "VENCIDAS") return matchesSearch && d.isExpired;
      return matchesSearch && d.publishStatus === statusFilter;
    });
  }, [destinations, search, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este destino? Solo se puede eliminar si no tiene paquetes hijos.")) return;
    const res = await fetch(`/api/admin/destinations/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "No se pudo eliminar el destino.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar destino..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 w-full sm:w-72"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="APPROVED">Aprobados</SelectItem>
                <SelectItem value="DRAFT">Borradores</SelectItem>
                <SelectItem value="VENCIDAS">Vencidos</SelectItem>
              </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/admin/destinos/nuevo">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Destino
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ubicación</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Paquetes</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Favs</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Reviews</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((destination) => (
                <tr key={destination.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {destination.photo ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative">
                          <SupabaseImage
                            imagePath={destination.photo}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{destination.title || "Sin título"}</p>
                        {destination.subtitle && (
                          <p className="text-xs text-muted-foreground">{destination.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[destination.municipality, destination.country]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{destination._count.Homes}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{destination._count.Favorite}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{destination._count.Review}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[destination.publishStatus] ?? "secondary"}>
                      {statusLabels[destination.publishStatus] ?? destination.publishStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/properties/${destination.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(destination.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron destinos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paginated.length} de {filtered.length} destinos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
