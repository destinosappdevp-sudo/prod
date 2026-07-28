import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { UserManagementClient } from "../components/UserManagementClient";

const prismaAny = prisma as any;

async function getUsers() {
  noStore();
  const users = await prismaAny.user.findMany({
    where: {
      role: { not: "SUPERADMIN" },
    },
    include: {
      _count: {
        select: {
          Favorite: true,
          Reservation: true,
          Saving: true,
        },
      },
    },
    orderBy: {
      email: "asc",
    },
  });

  const savingsAgg = await prismaAny.saving.groupBy({
    by: ["userId"],
    _sum: { amountUsd: true },
  });

  const savingsMap = new Map<string, number>();
  for (const row of savingsAgg as Array<{ userId: string; _sum: { amountUsd: number | null } }>) {
    savingsMap.set(row.userId, row._sum.amountUsd ?? 0);
  }

  return users.map((u: any) => ({
    ...u,
    savingsTotal: savingsMap.get(u.id) ?? 0,
  }));
}

export default async function UsersPage() {
  let users: any[] = [];
  let error: string | null = null;

  try {
    users = await getUsers();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido al cargar usuarios";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">Administra usuarios, roles y permisos</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-center">
          <p className="text-red-700 font-semibold">Error al cargar los usuarios</p>
          <p className="text-red-600 text-sm mt-2">{error}</p>
          <Link href="/admin/users" className="inline-block mt-4 text-sm text-primary hover:underline">
            Reintentar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra usuarios, roles y permisos</p>
        </div>
        <Link
          href="/admin/users/import"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-sm h-10 px-4 hover:bg-primary/90 transition-colors"
        >
          Importar CSV
        </Link>
      </div>

      <UserManagementClient initialUsers={users} />
    </div>
  );
}



