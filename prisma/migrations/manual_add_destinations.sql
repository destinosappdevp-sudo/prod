-- ============================================================
-- MIGRACIÓN MANUAL: Destinos como categorías padre
-- ============================================================
-- Ejecutar esto en staging/dev ANTES de correr el script de migración de datos.
-- No ejecutar en producción hasta validar en staging.
-- ============================================================

-- 1. Crear tabla Destination
CREATE TABLE IF NOT EXISTS "Destination" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT,
    subtitle TEXT,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    photo TEXT,
    country TEXT,
    municipality TEXT,
    exactAddress TEXT,
    contactNumber TEXT,
    "categoryName" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "propertyTypeId" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    price INTEGER,
    "priceVip" INTEGER,
    "vipSeats" INTEGER,
    "standardSeats" INTEGER,
    "checkInTime" TEXT,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Destination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Destination_userId_idx" ON "Destination"("userId");
CREATE INDEX "Destination_slug_idx" ON "Destination"(slug);

-- 2. Agregar destinationId a Home
ALTER TABLE "Home" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
CREATE INDEX "Home_destinationId_idx" ON "Home"("destinationId");

-- 3. Agregar destinationId a Favorite y Review, y hacer homeId nullable
ALTER TABLE "Favorite" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
ALTER TABLE "Favorite" ALTER COLUMN "homeId" DROP NOT NULL;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_destinationId_fkey" 
    FOREIGN KEY ("destinationId") REFERENCES "Destination"(id) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Favorite_destinationId_idx" ON "Favorite"("destinationId");

-- El unique constraint por homeId debe cambiar a destinationId
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_homeId_key";
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_destinationId_key" UNIQUE ("userId", "destinationId");

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "destinationId" TEXT;
ALTER TABLE "Review" ALTER COLUMN "homeId" DROP NOT NULL;
ALTER TABLE "Review" ADD CONSTRAINT "Review_destinationId_fkey" 
    FOREIGN KEY ("destinationId") REFERENCES "Destination"(id) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "Review_destinationId_idx" ON "Review"("destinationId");

-- 4. Agregar FK de Home -> Destination
ALTER TABLE "Home" ADD CONSTRAINT "Home_destinationId_fkey" 
    FOREIGN KEY ("destinationId") REFERENCES "Destination"(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Nota: después de ejecutar este SQL, correr el script scripts/migrate-destinations.js
-- para crear los destinos a partir de los paquetes activos y vincular hijos, favoritos y reviews.
