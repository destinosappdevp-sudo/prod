-- Migration: Remove HOST role from UserRole enum
-- NOTE: This migration cannot run inside a transaction because of enum type recreation
-- Prisma migrate: No transaction

-- 1. Clean up any leftovers from a previous failed attempt
DROP TYPE IF EXISTS "UserRole_new";

-- 2. Migrate any HOST users to GUEST
UPDATE "User" SET "role" = 'GUEST' WHERE "role" = 'HOST';

-- 3. Create new enum type without HOST
CREATE TYPE "UserRole_new" AS ENUM ('GUEST', 'ADMIN', 'SUPERADMIN');

-- 4. Set column default to null temporarily to allow type change
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- 5. Change the column type to the new enum (cast via text)
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING "role"::text::"UserRole_new";

-- 6. Drop old type and rename new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- 7. Restore default
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'GUEST'::"UserRole";
