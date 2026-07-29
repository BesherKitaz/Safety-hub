ALTER TABLE "CertificationHistory"
ALTER COLUMN "changedById" DROP NOT NULL;

CREATE TABLE "CertificationSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "durationDays" INTEGER NOT NULL DEFAULT 365,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CertificationSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CertificationSettings_durationDays_check" CHECK ("durationDays" BETWEEN 1 AND 3650)
);

INSERT INTO "CertificationSettings" ("id", "durationDays")
VALUES ('default', 365)
ON CONFLICT ("id") DO NOTHING;

ALTER TYPE "CertificationHistoryAction" ADD VALUE IF NOT EXISTS 'RENEWED';

-- Give legacy records without an expiry a fixed one-year date based on when
-- they were issued. Future setting changes do not modify these stored dates.
UPDATE "Certification"
SET "expiryDate" = "issuedAt" + INTERVAL '365 days'
WHERE "expiryDate" IS NULL;
