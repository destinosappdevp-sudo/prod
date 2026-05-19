"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type PublishStatus = "APPROVED" | "PENDING_APPROVAL" | "DRAFT" | "REJECTED";

interface PropertyStatusControlProps {
  propertyId: string;
  initialStatus: PublishStatus;
}

const statusUiMap: Record<
  PublishStatus,
  {
    label: string;
    approvalLabel: string;
    badgeClassName: string;
  }
> = {
  APPROVED: {
    label: "Activa",
    approvalLabel: "Aprobada",
    badgeClassName: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  PENDING_APPROVAL: {
    label: "Pendiente",
    approvalLabel: "Pendiente",
    badgeClassName: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  DRAFT: {
    label: "Inactiva",
    approvalLabel: "Pausada",
    badgeClassName: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
  REJECTED: {
    label: "Inactiva",
    approvalLabel: "Rechazada",
    badgeClassName: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export default function PropertyStatusControl({
  propertyId,
  initialStatus,
}: PropertyStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PublishStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentUi = statusUiMap[status];

  const handleStatusChange = async (nextStatus: "APPROVED" | "PENDING_APPROVAL" | "DRAFT") => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publishStatus: nextStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo actualizar el estado");
      }

      setStatus(nextStatus);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo actualizar el estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "¿Está seguro que desea eliminar esta propiedad? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "No se pudo eliminar la propiedad");
      }

      alert("Propiedad eliminada correctamente");
      router.push("/admin/properties");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar la propiedad");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge className={currentUi.badgeClassName}>{currentUi.label}</Badge>
      <div className="min-w-[180px]">
        <Select
          value={status === "REJECTED" ? "DRAFT" : status}
          onValueChange={(value) =>
            handleStatusChange(value as "APPROVED" | "PENDING_APPROVAL" | "DRAFT")
          }
          disabled={isUpdating}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="APPROVED">Activa</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pendiente</SelectItem>
            <SelectItem value="DRAFT">Inactiva</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-gray-500">Aprobación: {currentUi.approvalLabel}</p>
      <button
        onClick={handleDelete}
        disabled={isDeleting || isUpdating}
        className="ml-2 inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Eliminar propiedad"
      >
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  );
}



