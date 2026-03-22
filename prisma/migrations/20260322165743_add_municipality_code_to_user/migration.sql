/*
  Warnings:

  - A unique constraint covering the columns `[userId,homeId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Favorite` required. This step will fail if there are existing NULL values in that column.
  - Made the column `homeId` on table `Favorite` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_homeId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";

-- DropIndex
DROP INDEX "Banner_createdById_idx";

-- DropIndex
DROP INDEX "BlockedDate_homeId_startDate_endDate_idx";

-- DropIndex
DROP INDEX "Home_approvedById_idx";

-- DropIndex
DROP INDEX "Home_categoryName_gin_idx";

-- DropIndex
DROP INDEX "Home_propertyTypeId_gin_idx";

-- DropIndex
DROP INDEX "Home_propertyTypeId_idx";

-- DropIndex
DROP INDEX "WithdrawalRequest_hostId_status_createdAt_idx";

-- AlterTable
ALTER TABLE "BcvRateHistory" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BlockedDate" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "homeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PlatformConfig" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "municipalityCode" TEXT;

-- AlterTable
ALTER TABLE "WithdrawalRequest" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "UserDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usersessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "ip_address" TEXT,
    "location" TEXT,
    "last_active" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "usersessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_sessions_is_active" ON "usersessions"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_sessions_user_id" ON "usersessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "usersessions_user_id_device_id_key" ON "usersessions"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_homeId_key" ON "Favorite"("userId", "homeId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usersessions" ADD CONSTRAINT "usersessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
