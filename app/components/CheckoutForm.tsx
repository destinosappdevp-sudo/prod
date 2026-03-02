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
import { Smartphone, CreditCard, Building2, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { BANKS, getBankCode } from "@/app/lib/paymentBanks";

type PaymentMethod =
  | "PAGO_MOVIL"
  | "ZELLE"
  | "ZILLI"
  | "TARJETA_INTERNACIONAL"
  | "TRANSFERENCIA_BANCARIA";

interface CheckoutFormProps {
  homeId: string;
  userId: string;
  startDate: string;
  endDate: string;
  nights: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

export default function CheckoutForm({
  homeId,
  userId,
  startDate,
  endDate,
  nights,
  subtotal,
  serviceFee,
  total,
}: CheckoutFormProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("PAGO_MOVIL");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    cedula: "",
    emisorBank: "",
    referenceNumber: "",
  });

  const paymentMethods = [
    { value: "PAGO_MOVIL", label: "Pago Móvil", icon: Smartphone },
    { value: "ZELLE", label: "Zelle", icon: Globe },
    { value: "ZILLI", label: "Zilli", icon: CreditCard },
    {
      value: "TARJETA_INTERNACIONAL",
      label: "Tarjeta Internacional",
      icon: CreditCard,
    },
    {
      value: "TRANSFERENCIA_BANCARIA",
      label: "Transferencia Bancaria",
      icon: Building2,
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          nights,
          subtotal,
          serviceFee,
          totalAmount: total,
          paymentMethod: selectedMethod,
          paymentDetails: formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/reservation?success=true`);
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
        <h2 className="text-xl font-semibold mb-6">Cómo quieres pagar</h2>

        {/* Selector de método de pago */}
        <div className="space-y-3 mb-6">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => setSelectedMethod(method.value as PaymentMethod)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  selectedMethod === method.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-gray-600" />
                  <span className="font-medium">{method.label}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedMethod === method.value
                      ? "border-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedMethod === method.value && (
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Información del banco receptor (solo para métodos venezolanos) */}
        {(selectedMethod === "PAGO_MOVIL" ||
          selectedMethod === "TRANSFERENCIA_BANCARIA") && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Información de pago</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Banco:</span>{" "}
                {formData.emisorBank
                  ? `${getBankCode(formData.emisorBank)} - ${BANKS.find((b) => b.value === formData.emisorBank)?.name}`
                  : "Selecciona un banco"}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span> 0414-1234567
              </p>
              <p>
                <span className="font-medium">Cédula:</span> V-12345678
              </p>
            </div>
          </div>
        )}

        {/* Campos dinámicos según método de pago */}
        <div className="space-y-4">
          {(selectedMethod === "PAGO_MOVIL" ||
            selectedMethod === "TRANSFERENCIA_BANCARIA") && (
            <>
              <div>
                <Label htmlFor="emisorBank">Banco Emisor</Label>
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
                <Label htmlFor="phoneNumber">Teléfono</Label>
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
                <Label htmlFor="referenceNumber">Número de referencia</Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  placeholder="123456"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    handleInputChange("referenceNumber", e.target.value)
                  }
                  required
                />
              </div>
            </>
          )}

          {selectedMethod === "ZELLE" && (
            <>
              <div>
                <Label htmlFor="zelleEmail">Email de Zelle</Label>
                <Input
                  id="zelleEmail"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    handleInputChange("referenceNumber", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="zelleReference">Número de referencia</Label>
                <Input
                  id="zelleReference"
                  type="text"
                  placeholder="Referencia de transacción"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {(selectedMethod === "ZILLI" ||
            selectedMethod === "TARJETA_INTERNACIONAL") && (
            <>
              <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Fecha de vencimiento</Label>
                  <Input
                    id="expiryDate"
                    type="text"
                    placeholder="MM/AA"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                <Input
                  id="cardName"
                  type="text"
                  placeholder="Nombre completo"
                  required
                />
              </div>
            </>
          )}
        </div>

        {/* Botón de confirmación */}
        <Button
          type="submit"
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
          disabled={loading}
        >
          {loading ? "Procesando..." : "Confirmar y pagar"}
        </Button>
      </Card>
    </form>
  );
}
