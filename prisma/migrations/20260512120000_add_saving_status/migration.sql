-- CreateEnum
CREATE TYPE "SavingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add status and rejectionReason to Saving
ALTER TABLE "Saving" ADD COLUMN "status" "SavingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Saving" ADD COLUMN "rejectionReason" TEXT;
