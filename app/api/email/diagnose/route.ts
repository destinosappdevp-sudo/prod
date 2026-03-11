import { NextResponse } from "next/server";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";

/**
 * GET /api/email/diagnose
 * Endpoint de diagnóstico para verificar la configuración de Resend.
 * Protegido: solo responde en entornos de desarrollo/staging.
 */
export async function GET() {
  const apiKeyPresent = !!process.env.RESEND_API_KEY;
  const fromEmailPresent = !!process.env.RESEND_FROM_EMAIL;
  const clientReady = !!getResendClient();

  return NextResponse.json({
    resend: {
      apiKeyPresent,
      fromEmailPresent,
      fromEmail: FROM_EMAIL,
      clientReady,
    },
    status: clientReady ? "ok" : "missing_config",
  });
}
