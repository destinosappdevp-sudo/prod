"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WithdrawalActionsProps {
  withdrawalId: string;
}

export default function WithdrawalActions({
  withdrawalId,
}: WithdrawalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "process" | "reject") => {
    let adminNotes = "";

    if (action === "reject") {
      const reasonInput = window.prompt("Indica el motivo del rechazo:", "");
      if (reasonInput === null) return;
      adminNotes = reasonInput.trim();
      if (!adminNotes) {
        alert("Debes indicar un motivo para rechazar el retiro.");
        return;
      }
    }

    if (
      !confirm(
        `¿Estás seguro de que deseas ${action === "process" ? "procesar" : "rechazar"} este retiro?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes: adminNotes || null }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Error al procesar el retiro");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      <Button
        size="sm"
        onClick={() => handleAction("process")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-1" />
            Procesar
          </>
        )}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <X className="w-4 h-4 mr-1" />
            Rechazar
          </>
        )}
      </Button>
    </div>
  );
}
