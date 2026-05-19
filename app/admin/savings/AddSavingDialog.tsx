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
  email: string;
  cedula?: string | null;
};

type HomeOption = {
  id: string;
  title: string | null;
};

type WalletBalance = {
  userId: string;
  type: "general" | "package";
  homeId: string | null;
  homeTitle: string | null;
  amountBs: number;
  amountUsd: number;
};

type AddSavingDialogProps = {
  users: UserOption[];
  homes: HomeOption[];
  walletBalances: WalletBalance[];
};

export default function AddSavingDialog({ users, homes, walletBalances }: AddSavingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [savingType, setSavingType] = useState<"general" | "package">("general");
  const [selectedHome, setSelectedHome] = useState("");
  const [initialAmountUsd, setInitialAmountUsd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        const idA = (a.cedula || "").toLowerCase();
        const idB = (b.cedula || "").toLowerCase();
        if (idA !== idB) return idA.localeCompare(idB, "es");
        const nameA = `${a.firstName}`.toLowerCase();
        const nameB = `${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB, "es");
      }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return sortedUsers.slice(0, 50);
    return sortedUsers.filter((u) => {
      const ced = (u.cedula || "").toLowerCase();
      const name = `${u.firstName}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      return ced.includes(q) || name.includes(q) || email.includes(q);
    }).slice(0, 50);
  }, [userQuery, sortedUsers]);

  const existingWallet = useMemo(() => {
    if (!selectedUser) return null;

    return walletBalances.find((wallet) => {
      if (wallet.userId !== selectedUser) return false;
      if (savingType === "general") return wallet.type === "general";
      return wallet.type === "package" && wallet.homeId === selectedHome;
    }) || null;
  }, [walletBalances, selectedUser, savingType, selectedHome]);

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

    const parsedAmountUsd = Number(initialAmountUsd);
    if (!initialAmountUsd || !Number.isFinite(parsedAmountUsd) || parsedAmountUsd <= 0) {
      setError("Debes ingresar un monto inicial válido en USD.");
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
          amountUsd: parsedAmountUsd,
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
      setInitialAmountUsd("");
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
              <div className="relative">
                <Input
                  value={userQuery || (selectedUser ? (() => {
                    const u = users.find((x) => x.id === selectedUser);
                    return u ? `${u.cedula ? u.cedula + ' — ' : ''}${u.firstName}` : userQuery;
                  })() : userQuery)}
                  onChange={(e) => {
                    setUserQuery(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                  placeholder="Buscar por cédula, nombre o email"
                />

                <div className={`absolute left-0 right-0 mt-1 z-50 bg-white border rounded shadow max-h-60 overflow-auto ${showUserDropdown ? "" : "hidden"}`}>
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No se encontraron usuarios</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSelectedUser(user.id);
                          setUserQuery(`${user.cedula ? user.cedula + ' — ' : ''}${user.firstName}`);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      >
                        <div className="font-medium">{user.cedula ? `${user.cedula} — ` : ""}{user.firstName}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
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
            <label className="block text-sm font-medium text-gray-700">Monto a agregar (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={initialAmountUsd}
              onChange={(event) => setInitialAmountUsd(event.target.value)}
              placeholder="Ej: 50.00 (si ya existe, se suma)"
              required
            />
            <p className="text-xs text-gray-500">El equivalente en Bs se calcula automáticamente con la tasa BCV vigente.</p>
          </div>

          {selectedUser && (savingType === "general" || selectedHome) && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {existingWallet ? (
                <>
                  <p className="font-medium">Saldo actual de la alcancía:</p>
                  <p>
                    Bs. {Number(existingWallet.amountBs).toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {" "}
                    | USD ${Number(existingWallet.amountUsd).toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="font-medium">No existe alcancía para esta selección. Se creará una nueva.</p>
              )}
            </div>
          )}

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
              {submitting
                ? "Guardando..."
                : existingWallet
                ? "Agregar saldo"
                : "Crear alcancía"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


