-- Creation history has no previous certification state.
ALTER TABLE "CertificationHistory"
ALTER COLUMN "levelBefore" DROP NOT NULL,
ALTER COLUMN "statusBefore" DROP NOT NULL,
ALTER COLUMN "trainingNodeIdBefore" DROP NOT NULL;

-- Older creation entries copied the newly created record into both sides.
-- Clear that synthetic before-state so creation history is represented accurately.
UPDATE "CertificationHistory"
SET
  "levelBefore" = NULL,
  "statusBefore" = NULL,
  "expiryDateBefore" = NULL,
  "notesBefore" = NULL,
  "trainingNodeIdBefore" = NULL
WHERE "action" = 'CREATED';
