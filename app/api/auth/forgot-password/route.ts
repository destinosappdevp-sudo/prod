import { createAdminClient } from "@/app/lib/supabase/admin";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import { generatePasswordResetEmail } from "@/app/lib/email-templates";
import { NextRequest, NextResponse } from "next/server";

interface ForgotPasswordRequest {
  email: string;
}

function getRequestOrigin(request: NextRequest) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // Ignore invalid origin and continue with fallbacks.
    }
  }

  const forwardedHostHeader =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (forwardedHostHeader) {
    const host = forwardedHostHeader.split(",")[0]?.trim();
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      request.nextUrl.protocol.replace(":", "") ||
      "https";

    if (host) {
      return `${proto}://${host}`;
    }
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as ForgotPasswordRequest;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    const redirectTo = new URL(
      "/auth/reset-password",
      getRequestOrigin(request)
    ).toString();

    // Get Supabase admin client for generating reset link
    const adminClient = createAdminClient();
    if (!adminClient) {
      const missingVars: string[] = [];
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_URL) {
        missingVars.push("NEXT_PUBLIC_SUPABASE_URL o SUPABASE_URL");
      }
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
      }

      console.error(
        `[forgot-password] Configuración incompleta. Faltan: ${missingVars.join(", ") || "variables requeridas"}`
      );

      return NextResponse.json(
        { error: "Configuración de servidor incompleta", missing: missingVars },
        { status: 500 }
      );
    }

    // Generate reset link using Supabase admin API
    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (linkError || !data?.properties) {
      console.error("Supabase link generation error:", linkError);
      return NextResponse.json(
        { error: "No se pudo generar el enlace de recuperación" },
        { status: 500 }
      );
    }

    const tokenHash = data.properties.hashed_token;
    if (!tokenHash) {
      console.error("Supabase link generation returned no token_hash");
      return NextResponse.json(
        { error: "No se pudo generar un enlace valido de recuperación" },
        { status: 500 }
      );
    }

    const customResetUrl = new URL("/auth/reset-password", getRequestOrigin(request));
    customResetUrl.searchParams.set("token_hash", tokenHash);
    customResetUrl.searchParams.set("type", "recovery");
    const resetLink = customResetUrl.toString();

    // Send email with Resend using custom template
    const resend = getResendClient();
    if (!resend) {
      console.warn("RESEND_API_KEY no configurada; se omite email de recuperación.");
      return NextResponse.json(
        { error: "Servicio de email no disponible" },
        { status: 500 }
      );
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Recuperar tu contraseña - Zerkka",
      html: generatePasswordResetEmail({
        email,
        resetLink,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: "Error al enviar el email de recuperación" },
        { status: 500 }
      );
    }

    console.log(`✅ Email de recuperación enviado a ${email}`);

    return NextResponse.json({
      success: true,
      message: "Email de recuperación enviado",
    });
  } catch (error: any) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
