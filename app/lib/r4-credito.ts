import crypto from "crypto";
import type { PagoMovilCreditoCredentials } from "./pagomovil-config";

function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, "");
  if (p.startsWith("+58")) p = "0" + p.slice(3);
  if (p.startsWith("58") && p.length === 12) p = "0" + p.slice(2);
  return p;
}

function normalizeCedula(cedula: string): string {
  const c = cedula
    .trim()
    .toUpperCase()
    .replace(/[\s\.\-]/g, "");
  if (/^[VE]\d+$/.test(c)) return c;
  if (/^\d+$/.test(c)) return "V" + c;
  return c;
}

export interface CreditoInmediatoParams {
  banco: string; // Código 4 dígitos, ej "0134"
  cedula: string; // ej "V12345678"
  telefono: string; // ej "04145555555"
  monto: number;
  concepto?: string;
}

export interface CreditoInmediatoResult {
  ok: boolean;
  code?: string; // ACCP = aceptado, AC00 = en proceso
  reference?: string;
  operationId?: string;
  rawResponse?: unknown;
  error?: string;
}

export async function enviarCreditoInmediato(
  params: CreditoInmediatoParams,
  credentials?: PagoMovilCreditoCredentials,
): Promise<CreditoInmediatoResult> {
  let creds = credentials;
  if (!creds) {
    const { getPagoMovilCreditoCredentials } =
      await import("./pagomovil-config");
    creds = await getPagoMovilCreditoCredentials();
  }

  const commerce = creds.commerceId;
  const secret = creds.hmacSecret;
  const authToken = creds.authToken;

  if (!commerce || (!secret && !authToken)) {
    return { ok: false, error: "Credenciales de R4 Crédito no configuradas." };
  }

  const banco = params.banco.trim();
  const cedula = normalizeCedula(params.cedula);
  const telefono = normalizePhone(params.telefono);
  const monto = params.monto.toFixed(2);

  if (!/^\d{4}$/.test(banco)) {
    return { ok: false, error: `Código de banco inválido: "${banco}"` };
  }
  if (!/^[VE]\d{6,9}$/.test(cedula)) {
    return { ok: false, error: `Cédula inválida: "${cedula}"` };
  }
  if (!/^0\d{10}$/.test(telefono)) {
    return { ok: false, error: `Teléfono inválido: "${telefono}"` };
  }

  // HMAC: Banco + Cedula + Telefono + Monto (en ese orden exacto)
  const stringToSign = banco + cedula + telefono + monto;
  const authorization = secret ? generateHMAC(stringToSign, secret) : "";

  const payload = {
    Banco: banco,
    Cedula: cedula,
    Telefono: telefono,
    Monto: monto,
    Concepto: params.concepto || "Retiro de fondos",
  };

  // Intenta múltiples esquemas de auth (HMAC prefixed, HMAC raw, Bearer, raw token)
  const attempts: Array<{ header: string; label: string }> = [];
  if (authorization) {
    attempts.push({ header: `HMAC ${authorization}`, label: "hmac_prefixed" });
    attempts.push({ header: authorization, label: "hmac_raw" });
  }
  if (authToken) {
    attempts.push({ header: `Bearer ${authToken}`, label: "bearer_token" });
    attempts.push({ header: authToken, label: "raw_token" });
  }

  for (const attempt of attempts) {
    try {
      const res = await fetch(
        "https://r4conecta.mibanco.com.ve/CreditoInmediato",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: attempt.header,
            Commerce: commerce,
            IdComercio: commerce,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      const code = String(data?.code ?? "");

      if (code === "ACCP") {
        return {
          ok: true,
          code: "ACCP",
          reference: String(data?.reference ?? ""),
          rawResponse: data,
        };
      }
      if (code === "AC00") {
        return {
          ok: true,
          code: "AC00",
          operationId: String(data?.Id ?? ""),
          rawResponse: data,
        };
      }

      if (!res.ok && res.status === 401) continue; // intentar siguiente esquema
      return {
        ok: false,
        code,
        rawResponse: data,
        error: `Respuesta: ${JSON.stringify(data)}`,
      };
    } catch (err) {
      console.error(`[r4-credito] Error intento ${attempt.label}:`, err);
      continue;
    }
  }

  return { ok: false, error: "Agotados intentos de autenticación" };
}
