-- Support multiple property categories per Home while preserving legacy single-category fields.

ALTER TABLE "Home"
    ADD COLUMN IF NOT EXISTS "propertyTypeIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

ALTER TABLE "Home"
    ADD COLUMN IF NOT EXISTS "categoryNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill arrays from legacy single-value columns when needed.
UPDATE "Home"
SET "propertyTypeIds" = ARRAY["propertyTypeId"]
WHERE "propertyTypeId" IS NOT NULL
  AND ("propertyTypeIds" IS NULL OR cardinality("propertyTypeIds") = 0);

UPDATE "Home"
SET "categoryNames" = ARRAY["categoryName"]
WHERE "categoryName" IS NOT NULL
  AND btrim("categoryName") <> ''
  AND ("categoryNames" IS NULL OR cardinality("categoryNames") = 0);

CREATE INDEX IF NOT EXISTS "Home_propertyTypeIds_gin_idx"
    ON "Home" USING GIN ("propertyTypeIds");

CREATE INDEX IF NOT EXISTS "Home_categoryNames_gin_idx"
    ON "Home" USING GIN ("categoryNames");
