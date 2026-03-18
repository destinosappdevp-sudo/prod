-- Consolidar multi-categoria en los nombres originales del modelo Home.

ALTER TABLE "Home"
  DROP CONSTRAINT IF EXISTS "Home_propertyTypeId_fkey";

UPDATE "Home"
SET "categoryName" = NULL
WHERE "categoryName" = '';

ALTER TABLE "Home"
  ALTER COLUMN "categoryName" TYPE TEXT[]
  USING (
    CASE
      WHEN "categoryNames" IS NOT NULL AND cardinality("categoryNames") > 0 THEN "categoryNames"
      WHEN "categoryName" IS NULL THEN ARRAY[]::TEXT[]
      WHEN btrim("categoryName") = '' THEN ARRAY[]::TEXT[]
      ELSE ARRAY["categoryName"]
    END
  );

ALTER TABLE "Home"
  ALTER COLUMN "propertyTypeId" TYPE INTEGER[]
  USING (
    CASE
      WHEN "propertyTypeIds" IS NOT NULL AND cardinality("propertyTypeIds") > 0 THEN "propertyTypeIds"
      WHEN "propertyTypeId" IS NULL THEN ARRAY[]::INTEGER[]
      ELSE ARRAY["propertyTypeId"]
    END
  );

UPDATE "Home"
SET "categoryName" = ARRAY[]::TEXT[]
WHERE "categoryName" IS NULL;

UPDATE "Home"
SET "propertyTypeId" = ARRAY[]::INTEGER[]
WHERE "propertyTypeId" IS NULL;

ALTER TABLE "Home"
  ALTER COLUMN "categoryName" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "propertyTypeId" SET DEFAULT ARRAY[]::INTEGER[],
  ALTER COLUMN "categoryName" SET NOT NULL,
  ALTER COLUMN "propertyTypeId" SET NOT NULL;

DROP INDEX IF EXISTS "Home_categoryNames_gin_idx";
DROP INDEX IF EXISTS "Home_propertyTypeIds_gin_idx";

ALTER TABLE "Home"
  DROP COLUMN IF EXISTS "categoryNames",
  DROP COLUMN IF EXISTS "propertyTypeIds";

CREATE INDEX IF NOT EXISTS "Home_categoryName_gin_idx"
  ON "Home" USING GIN ("categoryName");

CREATE INDEX IF NOT EXISTS "Home_propertyTypeId_gin_idx"
  ON "Home" USING GIN ("propertyTypeId");
