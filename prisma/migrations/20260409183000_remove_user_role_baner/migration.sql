-- Quitar rol BANER: reasignar usuarios y actualizar enum UserRole (sin borrar tabla Banner).

UPDATE "User" SET role = 'GUEST' WHERE role = 'BANER';

CREATE TYPE "UserRole_new" AS ENUM ('GUEST', 'HOST', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'GUEST'::"UserRole_new";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
