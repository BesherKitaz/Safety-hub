-- AlterTable
ALTER TABLE "Lab" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Tool" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TrainingNode" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
