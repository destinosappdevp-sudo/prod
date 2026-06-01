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
  goalUsd: number | null;
  remainingUsd: number | null;
};

type WalletOption = {
  id: string;
  title: string;
  amountUsd: number;
  amountBs: number;
  goalUsd: number | null;
  remainingUsd: number | null;
  type: "general" | "package";
  homeId: string | null;
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
  const [selectedWalletKey, setSelectedWalletKey] = useState("");
  const [initialAmountUsd, setInitialAmountUsd] = useState("");
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);
  const [depositDate, setDepositDate] = useState<string>(todayIso);
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

  const walletOptions = useMemo(() => {
    if (!selectedUser) return [] as WalletOption[];

    const homeTitleById = new Map(homes.map((home) => [home.id, home.title || "Paquete sin título"]));
    const seen = new Set<string>();
    const options: WalletOption[] = [];

    for (const wallet of walletBalances) {
      if (wallet.userId !== selectedUser) continue;
      const key = `${wallet.type}:${wallet.homeId ?? "general"}`;
      if (seen.has(key)) continue;

      seen.add(key);
      options.push({
        id: key,
        title:
          wallet.type === "general"
            ? "Alcancía general"
            : wallet.homeTitle || (wallet.homeId ? homeTitleById.get(wallet.homeId) || "Paquete sin título" : "Paquete sin título"),
        amountUsd: Number(wallet.amountUsd ?? 0),
        amountBs: Number(wallet.amountBs ?? 0),
        goalUsd: wallet.goalUsd ?? null,
        remainingUsd: wallet.remainingUsd ?? null,
        type: wallet.type,
        homeId: wallet.homeId,
      });
    }

    // La alcancía general siempre debe estar disponible para abonar,
    // incluso si aún no existe movimiento previo para ese usuario.
    if (!seen.has("general:general")) {
      options.push({
        id: "general:general",
        title: "Alcancía general",
        amountUsd: 0,
        amountBs: 0,
        goalUsd: null,
        remainingUsd: null,
        type: "general",
        homeId: null,
      });
    }

    return options.sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [homes, selectedUser, walletBalances]);

  const selectedWallet = useMemo(() => {
    if (!selectedUser || !selectedWalletKey) return null;

    return (
      walletOptions.find((wallet) => wallet.id === selectedWalletKey) || null
    );
  }, [selectedUser, selectedWalletKey, walletOptions]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedUser) {
      setError("Debes seleccionar un usuario.");
      return;
    }

    if (!selectedWallet) {
      setError("Debes seleccionar una alcancía existente.");
      return;
    }

    const parsedAmountUsd = Number(initialAmountUsd);
    if (!initialAmountUsd || !Number.isFinite(parsedAmountUsd) || parsedAmountUsd <= 0) {
      setError("Debes ingresar un monto inicial válido en USD.");
      return;
    }

    if (!depositDate) {
      setError("Debes indicar la fecha del depósito.");
      return;
    }
    const parsedDate = new Date(`${depositDate}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      setError("La fecha del depósito no es válida.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/savings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          type: selectedWallet.type,
          homeId: selectedWallet.homeId,
          amountUsd: parsedAmountUsd,
          date: parsedDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo registrar el abono.");
        return;
      }

      if (data?.completedToReservation) {
        const reservationSuffix =
          typeof data?.reservationId === "string" && data.reservationId.trim().length > 0
            ? `\nReserva: ${data.reservationId}`
            : "";
        window.alert(
          `El abono completó la meta del paquete y fue convertido automáticamente en reserva.${reservationSuffix}`
        );
      }

      setOpen(false);
      setSelectedUser("");
      setSelectedWalletKey("");
      setInitialAmountUsd("");
      setDepositDate(todayIso);
      router.refresh();
    } catch {
      setError("Ocurrió un error al registrar el abono.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
          Abonar a Alcancía
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abonar a Alcancía</DialogTitle>
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
                          setSelectedWalletKey("");
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
            <label className="block text-sm font-medium text-gray-700">Alcancía existente</label>
            <Select value={selectedWalletKey} onValueChange={setSelectedWalletKey}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una alcancía existente" />
              </SelectTrigger>
              <SelectContent>
                {walletOptions.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.title}
                    {` · Actual USD $${wallet.amountUsd.toFixed(2)}`}
                    {wallet.type === "package" && wallet.remainingUsd !== null
                      ? ` · Restante USD $${Number(wallet.remainingUsd).toFixed(2)}`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Monto a agregar (USD)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={initialAmountUsd}
              onChange={(event) => setInitialAmountUsd(event.target.value)}
              placeholder="Ej: 50.00"
              required
            />
            <p className="text-xs text-gray-500">El equivalente en Bs se calcula automáticamente con la tasa BCV vigente.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Fecha del depósito</label>
            <Input
              type="date"
              value={depositDate}
              max={todayIso}
              onChange={(event) => setDepositDate(event.target.value)}
              required
            />
            <p className="text-xs text-gray-500">Por defecto es hoy. Puedes elegir una fecha anterior para cargar depósitos históricos.</p>
          </div>

          {selectedUser && selectedWallet && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-medium">Saldo actual de la alcancía:</p>
              <p>
                Bs. {Number(selectedWallet.amountBs).toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                {" "}
                | USD ${Number(selectedWallet.amountUsd).toFixed(2)}
              </p>
              {selectedWallet.type === "package" && selectedWallet.remainingUsd !== null && (
                <p className="mt-1">
                  <span className="font-medium">Saldo restante:</span>{" "}
                  USD ${Number(selectedWallet.remainingUsd).toFixed(2)}
                  {selectedWallet.goalUsd !== null
                    ? ` (meta USD $${Number(selectedWallet.goalUsd).toFixed(2)})`
                    : ""}
                </p>
              )}
            </div>
          )}

          {selectedUser && walletOptions.length === 0 && (
            <p className="text-xs text-amber-700">
              Este usuario no tiene alcancías existentes para abonar.
            </p>
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
              {submitting ? "Abonando..." : "Abonar a alcancía"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


