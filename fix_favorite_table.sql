-- Arreglar la tabla Favorite en Supabase
-- Ejecuta esto en Supabase SQL Editor

-- Paso 1: Eliminar constraints foráneos existentes
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_userId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_homeId_fkey";

-- Paso 2: Hacer userId y homeId NOT NULL
ALTER TABLE "Favorite" 
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "homeId" SET NOT NULL;

-- Paso 3: Agregar constraint único en (userId, homeId)
ALTER TABLE "Favorite" 
  ADD CONSTRAINT "Favorite_userId_homeId_key" UNIQUE ("userId", "homeId");

-- Paso 4: Agregar el valor por defecto para gen_random_uuid() si no existe
-- Primero verificar si hay registros con id NULL (no debería haber)
-- DELETE FROM "Favorite" WHERE "id" IS NULL;

-- Agregar el default SOLO si la columna no lo tiene
ALTER TABLE "Favorite" 
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Paso 5: Recrear los foreign keys con ON DELETE CASCADE
ALTER TABLE "Favorite" 
  ADD CONSTRAINT "Favorite_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite" 
  ADD CONSTRAINT "Favorite_homeId_fkey" 
  FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar que los cambios se aplicaron correctamente
-- SELECT column_name, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'Favorite';
