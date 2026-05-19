import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createClient } from "@/app/lib/supabase/server";

const prismaAny = prisma as any;

function parseBoolean(val: string | undefined): boolean {
  if (!val) return false;
  const lower = val.trim().toLowerCase();
  return lower === "si" || lower === "sí" || lower === "yes" || lower === "true" || lower === "1";
}

function parseDate(val: string | undefined): Date | null {
  if (!val || val.trim() === "") return null;
  // Soporta DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const clean = val.trim();
  const parts = clean.split(/[\/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // Si primer componente es 4 dígitos → YYYY-MM-DD
    const d = a.length === 4 ? new Date(`${a}-${b}-${c}`) : new Date(`${c}-${b}-${a}`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const dbUser = await prismaAny.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) {
    return NextResponse.json({ error: "El CSV está vacío o sin datos" }, { status: 400 });
  }

  // Detectar separador (coma o punto y coma)
  const sep = lines[0].includes(";") ? ";" : ",";

  // Normalizar encabezados: minúsculas, sin tildes, sin espacios
  const normalize = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

  const headers = lines[0].split(sep).map(normalize);

  const idx = (keys: string[]): number => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.includes(normalize(k)));
      if (i !== -1) return i;
    }
    return -1;
  };

  // Mapeo de columnas
  const COL = {
    nombre:          idx(["nombre", "name"]),
    correo:          idx(["correo", "email"]),
    cedula:          idx(["cedula", "cedula"]),
    nacimiento:      idx(["nacimiento", "fecha"]),
    telefono:        idx(["telefono", "phone"]),
    telefonoOpc:     idx(["opcional", "emergenc"]),
    direccion:       idx(["direccion", "address"]),
    ninos:           idx(["nino", "children", "viaja"]),
    edadesNinos:     idx(["edad", "age"]),
    salud:           idx(["enfermedad", "lesion", "salud", "health"]),
    haViajado:       idx(["viajado", "destino", "traveled"]),
    destino:         idx(["destino", "cual"]),
  };

  const results = { created: 0, updated: 0, errors: [] as string[] };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

    const get = (colIdx: number) => (colIdx >= 0 ? cols[colIdx] ?? "" : "");

    const email = get(COL.correo);
    if (!email || !email.includes("@")) {
      results.errors.push(`Línea ${i + 1}: correo inválido "${email}"`);
      continue;
    }

    const nombre = get(COL.nombre) || "Sin nombre";
    const cedula = get(COL.cedula) || null;
    const dateOfBirth = parseDate(get(COL.nacimiento));
    const phoneNumber = get(COL.telefono) || null;
    const emergencyPhone = get(COL.telefonoOpc) || null;
    const address = get(COL.direccion) || null;
    const rawNinos = get(COL.ninos);
    const travelsWithChildren = parseBoolean(rawNinos);
    // Si dice "si, 5 años" o similar, la edad puede estar en la misma celda o en la siguiente
    const childrenAgesFromNinos = travelsWithChildren && rawNinos.length > 3 ? rawNinos : null;
    const childrenAgesFromCol = get(COL.edadesNinos) || null;
    const childrenAges = childrenAgesFromCol || childrenAgesFromNinos || null;
    const healthConditions = get(COL.salud) || null;
    const rawViajado = get(COL.haViajado);
    const hasTraveledWithDestinos = parseBoolean(rawViajado);
    const lastTravelDestination = get(COL.destino) || null;

    try {
      const existing = await prismaAny.user.findFirst({ where: { email } });

      if (existing) {
        await prismaAny.user.update({
          where: { id: existing.id },
          data: {
            firstName: nombre,
            cedula,
            dateOfBirth,
            phoneNumber,
            emergencyPhone,
            address,
            travelsWithChildren,
            childrenAges,
            healthConditions,
            hasTraveledWithDestinos,
            lastTravelDestination,
          },
        });
        results.updated++;
      } else {
        // Crear en Supabase Auth primero con contraseña temporal
        const tempPassword = `Destinos${Math.random().toString(36).slice(2, 10)}!`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        });

        if (authError || !authData.user) {
          results.errors.push(`Línea ${i + 1}: error auth para "${email}" — ${authError?.message}`);
          continue;
        }

        await prismaAny.user.create({
          data: {
            id: authData.user.id,
            email,
            firstName: nombre,
            cedula,
            dateOfBirth,
            phoneNumber,
            emergencyPhone,
            address,
            travelsWithChildren,
            childrenAges,
            healthConditions,
            hasTraveledWithDestinos,
            lastTravelDestination,
            role: "GUEST",
          },
        });
        results.created++;
      }
    } catch (e: any) {
      results.errors.push(`Línea ${i + 1}: ${e?.message ?? "error desconocido"}`);
    }
  }

  return NextResponse.json(results);
}
