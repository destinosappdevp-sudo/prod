import { Resend } from "resend";

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

let resendClient: Resend | null = null;

// Build-safe lazy initialization: avoid throwing at import time when env vars are missing.
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
