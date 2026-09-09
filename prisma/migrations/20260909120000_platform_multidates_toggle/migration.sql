-- Flag múltiples fechas por destino (solo SUPERADMIN, default legacy OFF)
ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "multiDatesPerDestinationEnabled" BOOLEAN NOT NULL DEFAULT false;
