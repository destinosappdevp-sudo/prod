"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { BANKS } from "@/app/lib/paymentBanks";

type PaymentMethod = "PAGO_MOVIL";

interface CheckoutFormProps {
  homeId: string;
  userId: string;
  startDate: string;
  endDate: string;
  guests: number;
  nights: number;
  subtotal: number;
  total: number;
  bcvRate: number;
  totalBs: number;
}

export default function CheckoutForm({
  homeId,
  userId,
  startDate,
  endDate,
  guests,
  nights,
  subtotal,
  total,
  bcvRate,
  totalBs,
}: CheckoutFormProps) {
  const router = useRouter();
  const [selectedMethod] = useState<PaymentMethod>("PAGO_MOVIL");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    cedula: "",
    emisorBank: "",
    referenceNumber: "",
  });

  const hasValidBcvRate = Number.isFinite(bcvRate) && bcvRate > 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidBcvRate) {
      alert("No hay tasa BCV válida configurada para procesar este pago.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          userId,
          startDate,
          endDate,
          guests,
          nights,
          subtotal,
          serviceFee: 0,
          totalAmount: subtotal,
          totalAmountBs: totalBs,
          bcvRateUsed: bcvRate,
          paymentMethod: selectedMethod,
          paymentDetails: formData,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data?.reservationId) {
          router.push(`/reservation/${data.reservationId}`);
        } else {
          router.push("/my-dashboard?tab=reservations");
        }
      } else {
        alert(data.error || "Error al procesar el pago");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">Como quieres pagar</h2>

        <div className="mb-6">
          <div className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-orange-500 bg-orange-50">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-gray-600" />
              <span className="font-medium">Pago Movil</span>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            </div>
          </div>

          <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm">Informacion del receptor</h3>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Banco:</span> 0102 - Banco de Venezuela</p>
                <p><span className="font-medium">Telefono:</span> 0414-1234567</p>
                <p><span className="font-medium">Cedula:</span> V-12345678</p>
                <p><span className="font-medium">Monto a pagar:</span> {hasValidBcvRate ? `Bs ${totalBs.toFixed(2)}` : "No disponible"}</p>
                <p><span className="font-medium">Tasa BCV:</span> {hasValidBcvRate ? `Bs ${bcvRate.toFixed(6)} por USD` : "No disponible"}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="emisorBank">Tu Banco Emisor</Label>
              <Select
                value={formData.emisorBank}
                onValueChange={(value) => handleInputChange("emisorBank", value)}
                required
              >
                <SelectTrigger id="emisorBank">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.code} - {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Tu Telefono</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="0414-0000000"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="referenceNumber">Numero de referencia</Label>
              <Input
                id="referenceNumber"
                type="text"
                placeholder="123456"
                value={formData.referenceNumber}
                onChange={(e) => handleInputChange("referenceNumber", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" disabled={loading || !hasValidBcvRate}>
          {loading ? "Procesando..." : "Confirmar y pagar"}
        </Button>

        {!hasValidBcvRate && (
          <p className="text-xs text-red-500 mt-3">
            No se puede procesar el pago porque falta la tasa BCV del día.
          </p>
        )}
      </Card>
    </form>
  );
}
