import { NextRequest, NextResponse } from "next/server";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import {
  generateEmailConfirmationEmail,
  generateWelcomeEmail,
} from "@/app/lib/email-templates";

/**
 * Supabase Auth Hook — "Send Email"
 *
 * Supabase llama este endpoint en lugar de enviar el email por su cuenta.
 * Documentación: https://supabase.com/docs/guides/auth/auth-hooks#send-email-hook
 *
 * Variables de entorno requeridas:
 *   SUPABASE_HOOK_SECRET   → secret configurado en el dashboard de Supabase
 *   RESEND_API_KEY         → clave de la API de Resend
 *   RESEND_FROM_EMAIL      → dirección de envío verificada en Resend
 */

type SupabaseEmailHookPayload = {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, string | undefined>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type:
      | "signup"
      | "recovery"
      | "invite"
      | "magic_link"
      | "email_change_new"
      | "email_change_current";
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: NextRequest) {
  // ── Verificar el secret del webhook ──────────────────────────────────────
  const hookSecret = process.env.SUPABASE_HOOK_SECRET;
  if (hookSecret) {
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${hookSecret}`) {
      console.warn("[hook/send-email] Intento con secret inválido");
      return unauthorized();
    }
  }

  let payload: SupabaseEmailHookPayload;
  try {
    payload = (await request.json()) as SupabaseEmailHookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user, email_data } = payload;
  const { email_action_type, token_hash, site_url, redirect_to } = email_data;
  const toEmail = user?.email;

  if (!toEmail) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("[hook/send-email] RESEND_API_KEY no configurado; se rechaza el envío para evitar fallback de Supabase.");
    return NextResponse.json(
      { error: "Configuración de correo incompleta" },
      { status: 500 }
    );
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    toEmail.split("@")[0] ||
    "usuario";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // URL de confirmación apuntando al endpoint de verificación de Supabase Auth.
  const finalRedirect = redirect_to || site_url || "/";
  const confirmationUrl =
    `${supabaseUrl}/auth/v1/verify` +
    `?token=${encodeURIComponent(token_hash)}` +
    `&type=${encodeURIComponent(email_action_type)}` +
    `&redirect_to=${encodeURIComponent(finalRedirect)}`;

  let subject: string;
  let html: string;

  switch (email_action_type) {
    case "signup":
    case "invite":
      subject = "Confirma tu cuenta en Destinos Venezuela";
      html = generateEmailConfirmationEmail({
        email: toEmail,
        displayName,
        confirmationUrl,
      });
      break;

    case "recovery":
      subject = "Restablece tu contraseña en Destinos Venezuela";
      html = `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff;border-radius:10px;">
          <h2 style="color:#1f2937;">Restablecer contraseña</h2>
          <p style="color:#4b5563;">Hola <strong>${displayName}</strong>, haz clic abajo para crear una nueva contraseña:</p>
          <a href="${confirmationUrl}"
             style="display:inline-block;margin:20px 0;padding:12px 28px;background:#b45309;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
            Cambiar contraseña
          </a>
          <p style="color:#9ca3af;font-size:12px;">El enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.</p>
        </div>`;
      break;

    default:
      // Para tipos no manejados, dejar que Supabase procese normalmente.
      return NextResponse.json({});
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject,
      html,
    });

    if (result.error) {
      console.error("[hook/send-email] Resend rechazó el email:", result.error);
      // Devolvemos error para que Supabase reintente / use su fallback.
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  } catch (err) {
    console.error("[hook/send-email] Error enviando con Resend:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({});
}
