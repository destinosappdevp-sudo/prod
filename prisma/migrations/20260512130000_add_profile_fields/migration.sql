-- AddColumn cedula
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "cedula" TEXT;

-- AddColumn dateOfBirth
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);

-- AddColumn emergencyPhone
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;

-- AddColumn address
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "address" TEXT;

-- AddColumn healthConditions
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "healthConditions" TEXT;

-- AddColumn hasTraveledWithDestinos
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "hasTraveledWithDestinos" BOOLEAN NOT NULL DEFAULT false;

-- AddColumn lastTravelDestination
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lastTravelDestination" TEXT;
