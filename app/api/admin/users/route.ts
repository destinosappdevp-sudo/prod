import { createClient } from "@/app/lib/supabase/server";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que sea ADMIN o SUPERADMIN
    const userRecord = await (prisma as any).user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || ((userRecord as any).role !== "ADMIN" && (userRecord as any).role !== "SUPERADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Obtener todos los usuarios con sus estadísticas
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            Home: true,
            Favorite: true,
            Reservation: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (
      !currentUser ||
      (currentUser.role !== "ADMIN" && currentUser.role !== "SUPERADMIN")
    ) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role = "GUEST",
      phoneNumber,
      cedula,
    } = body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      role?: "GUEST" | "ADMIN" | "SUPERADMIN";
      phoneNumber?: string;
      cedula?: string;
    };

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, contraseña, nombre y apellido son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const allowedRoles = ["GUEST", "ADMIN", "SUPERADMIN"] as const;
    const finalRole = allowedRoles.includes(role as any) ? role : "GUEST";

    // Solo SUPERADMIN puede crear ADMIN o SUPERADMIN
    if (
      (finalRole === "ADMIN" || finalRole === "SUPERADMIN") &&
      currentUser.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "Solo un SUPERADMIN puede asignar este rol" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCedula = cedula ? String(cedula).trim() : null;

    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 409 }
      );
    }

    if (normalizedCedula) {
      const cedulaInUse = await prisma.user.findFirst({
        where: { cedula: normalizedCedula },
        select: { id: true },
      });
      if (cedulaInUse) {
        return NextResponse.json(
          { error: "La cédula ya está registrada" },
          { status: 409 }
        );
      }
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        {
          error:
            "Configuración de Supabase incompleta (falta SUPABASE_SERVICE_ROLE_KEY)",
        },
        { status: 500 }
      );
    }

    const { data: created, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (createError || !created?.user) {
      return NextResponse.json(
        { error: createError?.message || "No se pudo crear el usuario" },
        { status: 400 }
      );
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          id: created.user.id,
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: finalRole,
          phoneNumber: phoneNumber?.trim() || null,
          cedula: normalizedCedula,
        },
        include: {
          _count: {
            select: {
              Home: true,
              Favorite: true,
              Reservation: true,
            },
          },
        },
      });

      return NextResponse.json(newUser, { status: 201 });
    } catch (dbError) {
      // Rollback en Supabase Auth si falla la BD
      try {
        await adminClient.auth.admin.deleteUser(created.user.id);
      } catch (rollbackError) {
        console.error("Error en rollback de Supabase:", rollbackError);
      }
      console.error("Error creando usuario en BD:", dbError);
      return NextResponse.json(
        { error: "Error al crear usuario en la base de datos" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
