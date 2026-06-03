import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

type AuditActorType = "USER" | "ADMIN" | "SYSTEM";

type AuditEvent = {
  eventType: string;
  sourceRoute: string;
  actorType: AuditActorType;
  actorId: string | null;
  affectedUserId: string | null;
  transactionId: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  amountUsd?: number | null;
  amountBs?: number | null;
  bcvRate?: number | null;
  metadata?: Record<string, unknown>;
};

function safeString(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function writeAuditLog(event: AuditEvent): Promise<{ path: string; url: string } | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    // No interrumpir el flujo de negocio por ausencia de token de auditoría.
    console.warn("[audit-log] BLOB_READ_WRITE_TOKEN no está configurado; se omite escritura de log.");
    return null;
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const iso = now.toISOString();

  const eventSafe = safeString(event.eventType || "UNKNOWN_EVENT");
  const transactionSafe = safeString(event.transactionId || "no_tx");
  const suffix = randomUUID().slice(0, 8);

  const path = `audit-logs/savings/${yyyy}/${mm}/${dd}/${iso}-${eventSafe}-${transactionSafe}-${suffix}.json`;

  const payload = {
    ...event,
    loggedAt: iso,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
  };

  const result = await put(path, JSON.stringify(payload, null, 2), {
    access: "private",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });

  return { path, url: result.url };
}
