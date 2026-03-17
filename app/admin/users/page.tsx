import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import { UserManagementClient } from "../components/UserManagementClient";

async function getUsers() {
  noStore();
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

  return users;
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, roles y permisos</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Crear Usuario
        </button>
      </div>

      <UserManagementClient initialUsers={users} />
    </div>
  );
}
