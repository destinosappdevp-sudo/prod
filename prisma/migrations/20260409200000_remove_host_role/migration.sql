-- Migration: Remove HOST role from UserRole enum
-- Migrate any HOST users to GUEST first
UPDATE "User" SET "role" = 'GUEST' WHERE "role" = 'HOST';

-- Recreate enum without HOST value
CREATE TYPE "UserRole_new" AS ENUM ('GUEST', 'ADMIN', 'SUPERADMIN');

ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING "role"::text::"UserRole_new";

DROP TYPE "UserRole";

ALTER TYPE "UserRole_new" RENAME TO "UserRole";
