-- Existing lab-level training nodes become general training nodes.
UPDATE "TrainingNode"
SET "type" = 'GENERAL'
WHERE "type" = 'LAB';

-- PostgreSQL enum values cannot be removed directly, so replace the enum
-- after all rows have been migrated away from LAB.
ALTER TYPE "TrainingNodeType" RENAME TO "TrainingNodeType_old";

CREATE TYPE "TrainingNodeType" AS ENUM ('GENERAL', 'TOOL');

ALTER TABLE "TrainingNode"
ALTER COLUMN "type" TYPE "TrainingNodeType"
USING ("type"::text::"TrainingNodeType");

DROP TYPE "TrainingNodeType_old";
