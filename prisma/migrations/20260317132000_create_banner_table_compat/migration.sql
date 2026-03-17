DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'BannerTipo'
  ) THEN
    CREATE TYPE "BannerTipo" AS ENUM ('HERO1', 'HERO2', 'MEDIO1', 'MEDIO2', 'POP');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "url" TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "clientEmail" TEXT NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "imageUrl" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "tipo" "BannerTipo" NOT NULL DEFAULT 'HERO1',

  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Banner_createdById_fkey'
  ) THEN
    ALTER TABLE "Banner"
    ADD CONSTRAINT "Banner_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Banner_createdById_idx"
ON "Banner"("createdById");
