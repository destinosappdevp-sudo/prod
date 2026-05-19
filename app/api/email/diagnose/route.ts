import { NextResponse } from "next/server";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";

/**
 * GET /api/email/diagnose
 * Diagn�stico de configuraci�n de Resend + test de env�o real.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get("to");

  const apiKeyPresent = !!process.env.RESEND_API_KEY;
  const fromEmailPresent = !!process.env.RESEND_FROM_EMAIL;
  const resend = getResendClient();
  const clientReady = !!resend;

  const config = {
    apiKeyPresent,
    fromEmailPresent,
    fromEmail: FROM_EMAIL,
    clientReady,
  };

  // Si se pasa ?to=email, hace un env�o de prueba y devuelve el resultado de Resend
  if (testEmail && resend) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: testEmail,
        subject: "Test de configuración Destinos Venezuela",
        html: "<p>Este es un email de prueba para verificar que Resend está configurado correctamente.</p>",
      });
      const ok = !result.error;
      return NextResponse.json({ config, testSend: { ok, result } });
    } catch (error) {
      return NextResponse.json({
        config,
        testSend: { ok: false, error: String(error) },
      });
    }
  }

  return NextResponse.json({
    config,
    status: clientReady ? "ok" : "missing_config",
    hint: clientReady
      ? "Para probar env�o real: /api/email/diagnose?to=tu@email.com"
      : "Faltan variables de entorno RESEND_API_KEY o RESEND_FROM_EMAIL",
  });
}



