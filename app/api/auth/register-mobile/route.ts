import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/app/lib/db";
import { getStateByValue } from "@/app/lib/venezuelaStates";
import { getResendClient, FROM_EMAIL } from "@/app/lib/resend";
import { generateWelcomeEmail } from "@/app/lib/email-templates";

type RegisterMobileBody = {
  email?: string;
  password?: string;
  firstName?: string;
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  cedula?: string;
  stateCode?: string;
  state?: string;
  role?: "GUEST";
};

function normalizeCedulaValue(cedula?: string | null) {
  return (cedula || "").trim().toUpperCase();
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: CORS_HEADERS,
  });
}

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function sendWelcomeEmail(email: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn("[register-mobile] RESEND_API_KEY no configurada; se omite email de bienvenida para:", email);
    return;
  }

  const displayName = email.split("@")[0] || "nuevo usuario";

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Bienvenido a Destinos Venezuela",
      html: generateWelcomeEmail({
        email,
        displayName,
      }),
    });

    if (result.error) {
      console.error("[register-mobile] Resend rechazó el email:", result.error);
    }
  } catch (error) {
    console.error("[register-mobile] error enviando email:", error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterMobileBody;

    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();
    const firstName = (body.firstName ?? body.name ?? "").trim();
    const lastName = (body.lastName ?? "").trim();
    const phoneNumber = (body.phoneNumber ?? body.phone ?? "").trim();
    const cedula = normalizeCedulaValue(body.cedula);
    const stateCode = (body.stateCode ?? body.state ?? "").trim().toUpperCase();
    const role = "GUEST";

    if (!email || !password) {
      return jsonResponse({ error: "Email y contraseña son requeridos" }, 400);
    }

    if (!firstName || !lastName) {
      return jsonResponse({ error: "Nombre y apellido son requeridos" }, 400);
    }

    if (!phoneNumber || phoneNumber.length < 7) {
      return jsonResponse({ error: "Ingresa un número de teléfono válido" }, 400);
    }

    if (!cedula) {
      return jsonResponse({ error: "La cédula es requerida" }, 400);
    }

    if (!stateCode || !getStateByValue(stateCode)) {
      return jsonResponse({ error: "Debes seleccionar un estado válido" }, 400);
    }

    const cedulaInUse = await prisma.user.findFirst({
      where: {
        cedula: {
          equals: cedula,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (cedulaInUse) {
      return jsonResponse({ error: "La cédula ya está registrada por otro usuario" }, 409);
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      return jsonResponse(
        { error: "Configuración de servidor incompleta para autenticación" },
        500
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const statusCode = error.message.toLowerCase().includes("already") ? 409 : 400;
      return jsonResponse({ error: error.message }, statusCode);
    }

    if (data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email ?? email,
          firstName,
          lastName,
          phoneNumber,
          cedula,
          stateCode,
          role,
        },
        create: {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName,
          lastName,
          profileImage: `https://avatar.vercel.sh/${email}`,
          phoneNumber,
          cedula,
          stateCode,
          role,
        },
      });

      await sendWelcomeEmail(data.user.email ?? email);
    }

    let session = data.session;

    // Fallback para apps móviles: si signUp no devuelve sesión, intentamos login inmediato.
    if (!session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.warn("[register-mobile] cuenta creada sin sesión automática:", signInError.message);
      } else {
        session = signInData.session;
      }
    }

    return jsonResponse({
      success: true,
      message: "Cuenta creada correctamente",
      user: data.user,
      session,
      needsEmailConfirmation: !session,
    });
  } catch (error: any) {
    console.error("[register-mobile] error:", error);
    return jsonResponse(
      { error: error?.message || "Error al procesar el registro" },
      500
    );
  }
}