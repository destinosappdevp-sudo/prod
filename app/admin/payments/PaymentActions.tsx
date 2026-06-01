"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentActionsProps {
  paymentId: string;
  reservationId: string;
}

const EXTRA_LOADING_MS = 2500;

const delayMs = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export default function PaymentActions({ paymentId, reservationId }: PaymentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "confirm" | "reject") => {
    let rejectionReason = "";

    if (action === "reject") {
      const reasonInput = window.prompt(
        "Indica el motivo del rechazo para notificar al usuario:",
        ""
      );

      if (reasonInput === null) {
        return;
      }

      rejectionReason = reasonInput.trim();
      if (!rejectionReason) {
        alert("Debes indicar un motivo para rechazar el pago.");
        return;
      }
    }

    if (!confirm(`¿Estás seguro de que deseas ${action === "confirm" ? "confirmar" : "rechazar"} este pago?`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: rejectionReason || null }),
      });

      await delayMs(EXTRA_LOADING_MS);

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Error al procesar la acción");
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
        onClick={() => handleAction("confirm")}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Check className="w-4 h-4 mr-1" />
            Confirmar
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



