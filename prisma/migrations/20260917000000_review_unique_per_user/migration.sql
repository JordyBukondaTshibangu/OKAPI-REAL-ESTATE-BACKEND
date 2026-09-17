-- A user can only leave one review per agent and one review per property.
-- Remove any existing duplicates first (keep the earliest one per pair),
-- then add the unique indexes.

-- 1. Delete duplicate agent reviews (keep the oldest per userId+agentId)
DELETE FROM "Review"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "agentId") id
  FROM "Review"
  WHERE "agentId" IS NOT NULL
  ORDER BY "userId", "agentId", "createdAt" ASC
)
AND "agentId" IS NOT NULL;

-- 2. Delete duplicate property reviews (keep the oldest per userId+propertyId)
DELETE FROM "Review"
WHERE id NOT IN (
  SELECT DISTINCT ON ("userId", "propertyId") id
  FROM "Review"
  WHERE "propertyId" IS NOT NULL
  ORDER BY "userId", "propertyId", "createdAt" ASC
)
AND "propertyId" IS NOT NULL;

-- 3. Add unique constraints
CREATE UNIQUE INDEX "Review_userId_agentId_key"
  ON "Review"("userId", "agentId")
  WHERE "agentId" IS NOT NULL;

CREATE UNIQUE INDEX "Review_userId_propertyId_key"
  ON "Review"("userId", "propertyId")
  WHERE "propertyId" IS NOT NULL;
