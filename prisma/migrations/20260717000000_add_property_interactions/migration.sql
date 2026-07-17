-- CreateTable PropertyInteraction for deduplicating view/share/whatsapp tracking
CREATE TABLE "PropertyInteraction" (
    "id"         TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId"     TEXT,
    "sessionId"  TEXT,
    "action"     TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyInteraction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PropertyInteraction" ADD CONSTRAINT "PropertyInteraction_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique index: one entry per logged-in user per property per action
CREATE UNIQUE INDEX "PropertyInteraction_propertyId_userId_action_key"
    ON "PropertyInteraction"("propertyId", "userId", "action")
    WHERE "userId" IS NOT NULL;

-- Index for anonymous session lookups
CREATE INDEX "PropertyInteraction_propertyId_sessionId_action_idx"
    ON "PropertyInteraction"("propertyId", "sessionId", "action");

-- Index for aggregate queries per property
CREATE INDEX "PropertyInteraction_propertyId_action_idx"
    ON "PropertyInteraction"("propertyId", "action");
