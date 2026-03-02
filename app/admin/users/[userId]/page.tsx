import { Card } from "@/components/ui/card";
import prisma from "@/app/lib/db";
import { notFound } from "next/navigation";
import { EditUserClient } from "../../components/EditUserClient";

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  return user;
}

export default async function EditUserPage({
  params,
}: {
  params: { userId: string };
}) {
  const user = await getUser(params.userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Editar Usuario
          </h1>
          <p className="text-gray-600 mt-1">
            {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <EditUserClient user={user} />
    </div>
  );
}
