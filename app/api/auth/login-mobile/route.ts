import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/app/lib/db";

type LoginMobileBody = {
  email?: string;
  password?: string;
};

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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginMobileBody;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = (body.password ?? "").trim();

    if (!email || !password) {
      return jsonResponse({ error: "Email y contraseña son requeridos" }, 400);
    }

    const supabase = createSupabaseClient();
    if (!supabase) {
      return jsonResponse(
        { error: "Configuración de servidor incompleta para autenticación" },
        500
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorMap: Record<string, string> = {
        "Invalid login credentials": "Correo o contraseña incorrectos",
        "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión",
        "Too many requests": "Demasiados intentos. Intenta más tarde",
        "User not found": "No existe una cuenta con ese correo",
      };

      return jsonResponse(
        { error: errorMap[error.message] ?? error.message },
        401
      );
    }

    if (data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email ?? email,
        },
        create: {
          id: data.user.id,
          email: data.user.email ?? email,
          firstName: "Usuario",
          profileImage: `https://avatar.vercel.sh/${email}`,
        },
      });
    }

    return jsonResponse({
      success: true,
      message: "Inicio de sesión exitoso",
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (error: any) {
    console.error("[login-mobile] error:", error);
    return jsonResponse(
      { error: error?.message || "Error al procesar el inicio de sesión" },
      500
    );
  }
}


