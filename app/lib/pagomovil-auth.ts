import { createHmac, timingSafeEqual } from "crypto";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getAllowedIps(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "";
}

export function normalizePhone(value: string): string {
  let digits = String(value).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("58")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function normalizeCedula(value: string): string {
  return String(value).replace(/\D/g, "");
}

export function normalizeBankCode(value: string): string {
  const digits = String(value).replace(/\D/g, "");
  return digits.padStart(4, "0");
}

export function extractAuthToken(value: string): string {
  if (!value) return "";
  if (value.startsWith("Bearer ")) return value.slice(7).trim();
  if (value.startsWith("HMAC ")) return value.slice(5).trim();
  return value.trim();
}

export function secureCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Uint8Array.from(Buffer.from(a, "hex"));
  const bBuf = Uint8Array.from(Buffer.from(b, "hex"));
  if (aBuf.length !== bBuf.length || aBuf.length === 0) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function isAuthorized(
  request: Request,
  rawBody: string,
  credentials: { hmacSecret?: string; authToken?: string },
): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = extractAuthToken(authHeader);

  const hmacSecret = credentials.hmacSecret;
  if (hmacSecret && /^[A-Fa-f0-9]{64}$/.test(token)) {
    const expected = createHmac("sha256", hmacSecret)
      .update(rawBody)
      .digest("hex");
    if (secureCompareHex(token.toLowerCase(), expected.toLowerCase()))
      return true;
  }

  const expectedToken = credentials.authToken?.trim();
  if (expectedToken && token === expectedToken) return true;

  return false;
}
