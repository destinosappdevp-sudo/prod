import prisma from "@/app/lib/db";

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"] as const;

export async function getRoleForNewUserBootstrap(): Promise<"GUEST" | "SUPERADMIN"> {
  const adminCount = await prisma.user.count({
    where: {
      role: { in: [...ADMIN_ROLES] },
    },
  });

  return adminCount === 0 ? "SUPERADMIN" : "GUEST";
}

export async function ensureAtLeastOneSuperadmin(userId: string) {
  const adminCount = await prisma.user.count({
    where: {
      role: { in: [...ADMIN_ROLES] },
    },
  });

  if (adminCount === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "SUPERADMIN" },
    });
  }
}



