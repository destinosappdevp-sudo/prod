DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PublishStatus'
  ) THEN
    CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PaymentMethod'
  ) THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('PAGO_MOVIL', 'ZELLE', 'ZILLI', 'TARJETA_INTERNACIONAL', 'TRANSFERENCIA_BANCARIA');
  END IF;
END $$;

ALTER TABLE "Home"
ADD COLUMN IF NOT EXISTS "approvalRejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approvedById" TEXT,
ADD COLUMN IF NOT EXISTS "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS "paymentAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "paymentBank" TEXT,
ADD COLUMN IF NOT EXISTS "paymentDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod",
ADD COLUMN IF NOT EXISTS "paymentReference" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Home_approvedById_fkey'
  ) THEN
    ALTER TABLE "Home"
    ADD CONSTRAINT "Home_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Home_approvedById_idx"
ON "Home"("approvedById");
