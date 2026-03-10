import { createAdminClient } from "@/app/lib/supabase/admin";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import { generatePasswordResetEmail } from "@/app/lib/email-templates";
import { NextRequest, NextResponse } from "next/server";

interface ForgotPasswordRequest {
  email: string;
  redirectUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl } = (await request.json()) as ForgotPasswordRequest;

    if (!email || !redirectUrl) {
      return NextResponse.json(
        { error: "Email y redirectUrl son requeridos" },
        { status: 400 }
      );
    }

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
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !data?.properties?.action_link) {
      console.error("Supabase link generation error:", linkError);
      return NextResponse.json(
        { error: "No se pudo generar el enlace de recuperación" },
        { status: 500 }
      );
    }

    const resetLink = data.properties.action_link;

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
