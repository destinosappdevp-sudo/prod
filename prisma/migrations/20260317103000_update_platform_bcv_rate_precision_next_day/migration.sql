ALTER TABLE "PlatformConfig"
ALTER COLUMN "bcvRate" TYPE DECIMAL(18, 8) USING ROUND("bcvRate"::numeric, 8),
ALTER COLUMN "bcvRate" SET DEFAULT 0.00000000;

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'PlatformConfig'
			AND column_name = 'bcvRateNextDay'
	) THEN
		ALTER TABLE "PlatformConfig"
		RENAME COLUMN "bcvRateNextDay" TO "bcvProximaRate";
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'PlatformConfig'
			AND column_name = 'bcvRateNextDayDate'
	) THEN
		ALTER TABLE "PlatformConfig"
		RENAME COLUMN "bcvRateNextDayDate" TO "bcvProximaRateDate";
	END IF;
END $$;

ALTER TABLE "PlatformConfig"
ADD COLUMN IF NOT EXISTS "bcvProximaRate" DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS "bcvProximaRateDate" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "BcvRateHistory" (
	"id" TEXT NOT NULL,
	"effectiveDate" TIMESTAMP(3) NOT NULL,
	"rate" DECIMAL(18, 8) NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "BcvRateHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BcvRateHistory_effectiveDate_key"
ON "BcvRateHistory"("effectiveDate");
