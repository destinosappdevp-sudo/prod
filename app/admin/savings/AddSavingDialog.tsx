"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type HomeOption = {
  id: string;
  title: string | null;
};

type AddSavingDialogProps = {
  users: UserOption[];
  homes: HomeOption[];
};

export default function AddSavingDialog({ users, homes }: AddSavingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [savingType, setSavingType] = useState<"general" | "package">("general");
  const [selectedHome, setSelectedHome] = useState("");
  const [initialAmountBs, setInitialAmountBs] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName} ${b.email}`.toLowerCase();
        return nameA.localeCompare(nameB, "es");
      }),
    [users]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Debes seleccionar un usuario.");
      return;
    }

    if (savingType === "package" && !selectedHome) {
      setError("Debes seleccionar un paquete.");
      return;
    }

    const parsedAmountBs = Number(initialAmountBs);
    if (!initialAmountBs || !Number.isFinite(parsedAmountBs) || parsedAmountBs <= 0) {
      setError("Debes ingresar un monto inicial válido en Bs.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          type: savingType,
          homeId: savingType === "package" ? selectedHome : null,
          amountBs: parsedAmountBs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo crear la alcancía.");
        return;
      }

      setOpen(false);
      setSelectedUser("");
      setSavingType("general");
      setSelectedHome("");
      setInitialAmountBs("");
      router.refresh();
    } catch {
      setError("Ocurrió un error al crear la alcancía.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          Crear/Editar Alcancía
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear/Editar Alcancía</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {sortedUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de alcancía</label>
            <Select
              value={savingType}
              onValueChange={(value: "general" | "package") => {
                setSavingType(value);
                if (value === "general") {
                  setSelectedHome("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="package">Por paquete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {savingType === "package" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Paquete</label>
              <Select value={selectedHome} onValueChange={setSelectedHome}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paquete" />
                </SelectTrigger>
                <SelectContent>
                  {homes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.title || "Paquete sin título"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Monto a agregar (Bs)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={initialAmountBs}
              onChange={(event) => setInitialAmountBs(event.target.value)}
              placeholder="Ej: 1500 (si ya existe, se suma)"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {submitting ? "Guardando..." : "Crear/Agregar saldo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}