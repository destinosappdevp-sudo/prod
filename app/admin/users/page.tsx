import { Card } from "@/components/ui/card";
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
        },
      },
      Saving: {
        select: { amountUsd: true },
      },
    },
    orderBy: {
      email: "asc",
    },
  });

  return users.map((u: any) => ({
    ...u,
    savingsTotal: (u.Saving as { amountUsd: number }[]).reduce(
      (sum, s) => sum + s.amountUsd,
      0
    ),
  }));
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos</p>
        </div>
        <Link
          href="/admin/users/import"
          className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Importar CSV
        </Link>
      </div>

      <UserManagementClient initialUsers={users} />
    </div>
  );
}



