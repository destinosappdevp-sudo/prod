"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AuthPanel } from "./AuthPanel";

type AuthMode = "login" | "register";
type AuthRole = "GUEST";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextPath?: string;
  initialMode?: AuthMode;
  initialRole?: AuthRole;
}

export function AuthDialog({
  open,
  onOpenChange,
  nextPath,
  initialMode = "login",
  initialRole = "GUEST",
}: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1rem)] max-w-2xl gap-0 overflow-y-auto rounded-[28px] border border-gray-200 p-0 shadow-2xl sm:w-[calc(100vw-2rem)] sm:rounded-[32px]">
        <DialogTitle className="sr-only">
          {initialMode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </DialogTitle>
        <AuthPanel
          variant="dialog"
          initialMode={initialMode}
          initialRole={initialRole}
          nextPath={nextPath}
          onSuccess={() => onOpenChange(false)}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}