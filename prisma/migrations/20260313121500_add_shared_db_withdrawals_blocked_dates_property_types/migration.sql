-- Shared DB migration for Next (Airbnb) and Expo (ZerkkApp)
-- Adds host withdrawals, blocked dates, property types, platform config,
-- and Home.propertyTypeId in a backward-compatible way.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'WithdrawalStatus'
    ) THEN
        CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "PlatformConfig" (
    "id" TEXT NOT NULL,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlatformConfig"
    ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
    ALTER COLUMN "commissionPercent" SET DEFAULT 10.0,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "maintenanceMode" SET DEFAULT false;

CREATE TABLE IF NOT EXISTS "property_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT DEFAULT 'home',

    CONSTRAINT "property_types_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "property_types"
    ADD COLUMN IF NOT EXISTS "icon" TEXT;

ALTER TABLE "property_types"
    ALTER COLUMN "icon" SET DEFAULT 'home';

CREATE TABLE IF NOT EXISTS "BlockedDate" (
    "id" TEXT NOT NULL,
    "homeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BlockedDate"
    ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentDetails" JSONB,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WithdrawalRequest"
    ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text,
    ALTER COLUMN "status" SET DEFAULT 'PENDING',
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Home"
    ADD COLUMN IF NOT EXISTS "propertyTypeId" INTEGER;

UPDATE "Home" h
SET "propertyTypeId" = pt."id"
FROM "property_types" pt
WHERE h."propertyTypeId" IS NULL
  AND h."categoryName" IS NOT NULL
  AND pt."name" = h."categoryName";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'Home_propertyTypeId_fkey'
    ) THEN
        ALTER TABLE "Home"
        ADD CONSTRAINT "Home_propertyTypeId_fkey"
        FOREIGN KEY ("propertyTypeId") REFERENCES "property_types"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'BlockedDate_homeId_fkey'
    ) THEN
        ALTER TABLE "BlockedDate"
        ADD CONSTRAINT "BlockedDate_homeId_fkey"
        FOREIGN KEY ("homeId") REFERENCES "Home"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'WithdrawalRequest_hostId_fkey'
    ) THEN
        ALTER TABLE "WithdrawalRequest"
        ADD CONSTRAINT "WithdrawalRequest_hostId_fkey"
        FOREIGN KEY ("hostId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Home_propertyTypeId_idx"
    ON "Home"("propertyTypeId");

CREATE INDEX IF NOT EXISTS "BlockedDate_homeId_startDate_endDate_idx"
    ON "BlockedDate"("homeId", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "WithdrawalRequest_hostId_status_createdAt_idx"
    ON "WithdrawalRequest"("hostId", "status", "createdAt");
