"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CalendarDays } from "lucide-react";
import { SupabaseImage } from "@/app/components/SupabaseImage";

export type PasadaItem = {
  id: string;
  title: string | null;
  photo: string | null;
  country: string | null;
  municipality: string | null;
  price: number | null;
  checkInTime: Date;
  publishStatus: string;
  createdAt: Date;
  destinationId: string | null;
  Destination: { id: string; title: string | null; slug: string } | null;
  _count: {
    Reservation: number;
    Favorite: number;
  };
};

interface PasadasClientProps {
  packages: PasadaItem[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
};

export function PasadasClient({ packages }: PasadasClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (p.title?.toLowerCase().includes(q) ?? false) ||
        (p.municipality?.toLowerCase().includes(q) ?? false) ||
        (p.country?.toLowerCase().includes(q) ?? false) ||
        (p.Destination?.title?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [packages, search]);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paquete pasado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Paquete</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Destino</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Fecha de salida</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Reservas</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {pkg.photo ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden">
                        <SupabaseImage imagePath={pkg.photo} alt="" fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-muted-foreground">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                    )}
                    <p className="font-medium text-foreground">{pkg.title || "Sin título"}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {pkg.Destination ? (
                    <Link href={`/admin/properties/${pkg.Destination.id}`} className="text-blue-600 hover:underline">
                      {pkg.Destination.title || "Ver destino"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Sin destino</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-gray-700">
                    {pkg.checkInTime.toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <br />
                  <span className="text-xs text-red-500 font-medium">Vencido</span>
                </td>
                <td className="px-4 py-3 text-center font-medium">{pkg._count.Reservation}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[pkg.publishStatus] ?? "secondary"}>
                    {statusLabels[pkg.publishStatus] ?? pkg.publishStatus}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/packages/${pkg.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No se encontraron paquetes pasados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
