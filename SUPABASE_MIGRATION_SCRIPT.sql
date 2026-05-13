-- Script para Supabase PostgreSQL
-- Ejecuta este script en la consola SQL de Supabase para agregar los nuevos campos de perfil

-- Agregar columna: Cédula
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "cedula" TEXT;

-- Agregar columna: Fecha de Nacimiento
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3);

-- Agregar columna: Teléfono de Emergencia
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;

-- Agregar columna: Dirección de Habitación
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Agregar columna: Padece alguna enfermedad o lesión (especifique)
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "healthConditions" TEXT;

-- Agregar columna: Ha viajado con Destinos Venezuela
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "hasTraveledWithDestinos" BOOLEAN NOT NULL DEFAULT false;

-- Agregar columna: Último destino visitado con Destinos Venezuela
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "lastTravelDestination" TEXT;

-- Verificar que las columnas fueron creadas correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN ('cedula', 'dateOfBirth', 'emergencyPhone', 'address', 'healthConditions', 'hasTraveledWithDestinos', 'lastTravelDestination')
ORDER BY ordinal_position;
