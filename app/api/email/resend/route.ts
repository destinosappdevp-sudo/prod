import { NextRequest, NextResponse } from "next/server";
import { FROM_EMAIL, getResendClient } from "@/app/lib/resend";

type SendTestEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET() {
  const apiKeyPresent = Boolean(process.env.RESEND_API_KEY);
  const fromEmailPresent = Boolean(process.env.RESEND_FROM_EMAIL);
  const clientReady = Boolean(getResendClient());

  return NextResponse.json({
    ok: clientReady,
    config: {
      apiKeyPresent,
      fromEmailPresent,
      fromEmail: FROM_EMAIL,
      clientReady,
    },
    hint: clientReady
      ? "Usa POST /api/email/resend con { to } para enviar un correo de prueba"
      : "Faltan variables RESEND_API_KEY o RESEND_FROM_EMAIL",
  });
}

export async function POST(request: NextRequest) {
  try {
    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { ok: false, error: "Resend no esta configurado" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as SendTestEmailBody;
    const to = (body?.to || "").trim().toLowerCase();

    if (!to || !isValidEmail(to)) {
      return NextResponse.json(
        { ok: false, error: "Debes enviar un email valido en el campo 'to'" },
        { status: 400 }
      );
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: body.subject?.trim() || "Prueba de Resend - Destinos Venezuela",
      html:
        body.html?.trim() ||
        "<p>Este correo confirma que la API de Resend esta activa en Destinos Venezuela.</p>",
    });

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.message, details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: result.data?.id || null });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Error enviando correo" },
      { status: 500 }
    );
  }
}
