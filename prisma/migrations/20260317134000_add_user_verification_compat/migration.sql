DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'VerificationStatus'
  ) THEN
    CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'UserRole'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'BANER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'BANER';
  END IF;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "verificationReason" TEXT,
ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "document1Image" TEXT,
ADD COLUMN IF NOT EXISTS "document2Image" TEXT,
ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED';
