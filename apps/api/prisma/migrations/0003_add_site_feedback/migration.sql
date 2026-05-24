-- Site-wide feedback about SmatWay (separate from per-booking Review).
CREATE TABLE "SiteFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteFeedback_createdAt_idx" ON "SiteFeedback"("createdAt");

ALTER TABLE "SiteFeedback" ADD CONSTRAINT "SiteFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
