import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import prisma from "@/app/lib/db";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Verificar autenticación
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Verificar que sea SUPERADMIN
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userRecord || userRecord.role !== "SUPERADMIN") {
      return NextResponse.json(
        { error: "Solo superadmins pueden reiniciar la base de datos" },
        { status: 403 }
      );
    }

    // Borrar datos SIN transacción para evitar rollbacks silenciosos
    const superAdminId = user.id;

    // Función auxiliar para borrar de forma segura
    const safeDeletion = async (name: string, fn: () => Promise<any>) => {
      try {
        const result = await fn();
        console.log(`✓ Deleted ${name}:`, result.count);
        return result;
      } catch (error: any) {
        const msg = error.message || String(error);
        // Ignorar solo si tabla no existe
        if (msg.includes("does not exist")) {
          console.log(`⊘ Skipped ${name} (table not found)`);
        } else {
          console.error(`✗ Error deleting ${name}:`, msg);
          throw error;
        }
      }
    };

    // Borrar en orden de dependencias
    await safeDeletion("Review", () => prisma.review.deleteMany({}));
    await safeDeletion("Favorite", () => prisma.favorite.deleteMany({}));
    await safeDeletion("Payment", () => prisma.payment.deleteMany({}));
    await safeDeletion("Reservation", () => prisma.reservation.deleteMany({}));
    await safeDeletion("AuditLog", () => prisma.auditLog.deleteMany({}));
    await safeDeletion("HomeAmenity", () => prisma.homeAmenity.deleteMany({}));
    await safeDeletion("BlockedDate", () => prisma.blockedDate.deleteMany({}));
    await safeDeletion("Home", () => prisma.home.deleteMany({}));
    await safeDeletion("Banner", () => prisma.banner.deleteMany({}));

    // Preferences y documentos
    await safeDeletion("NotificationPreferences", () =>
      prisma.notificationPreferences.deleteMany({
        where: { userId: { not: superAdminId } },
      })
    );

    await safeDeletion("UserDocument", () =>
      prisma.userDocument.deleteMany({
        where: { userId: { not: superAdminId } },
      })
    );

    await safeDeletion("WithdrawalRequest", () =>
      prisma.withdrawalRequest.deleteMany({})
    );

    await safeDeletion("usersessions", () =>
      (prisma as any).usersessions.deleteMany({
        where: { user_id: { not: superAdminId } },
      })
    );

    await safeDeletion("Message", () => prisma.message.deleteMany({}));

    // Usuarios excepto superadmin
    await safeDeletion("User (except superadmin)", () =>
      prisma.user.deleteMany({
        where: { id: { not: superAdminId } },
      })
    );

    // Amenities
    await safeDeletion("Amenity", () => prisma.amenity.deleteMany({}));
    await safeDeletion("AmenityCategory", () =>
      prisma.amenityCategory.deleteMany({})
    );

    // Tablas legacy
    const legacyTables = ["bids", "comments", "images"] as const;
    const legacyDeleteSql: Record<(typeof legacyTables)[number], Prisma.Sql> = {
      bids: Prisma.sql`DELETE FROM "bids"`,
      comments: Prisma.sql`DELETE FROM "comments"`,
      images: Prisma.sql`DELETE FROM "images"`,
    };

    for (const table of legacyTables) {
      await safeDeletion(`legacy ${table}`, () =>
        (prisma as any).$executeRaw(legacyDeleteSql[table])
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Base de datos reiniciada correctamente. Solo el superadmin permanece.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resetting database:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al reiniciar base de datos: ${errorMessage}` },
      { status: 500 }
    );
  }
}
