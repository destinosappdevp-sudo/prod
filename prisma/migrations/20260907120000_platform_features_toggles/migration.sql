-- Toggles de plataforma (configurables solo por SUPERADMIN)
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "allowPrivatePackages" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "transportEnc32Enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "transportVan20Enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "transportVan20PasilloEnabled" BOOLEAN NOT NULL DEFAULT false;
