/*
  Warnings:

  - Made the column `labId` on table `TrainingNode` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TrainingNode" DROP CONSTRAINT "TrainingNode_labId_fkey";

-- AlterTable
ALTER TABLE "TrainingNode" ALTER COLUMN "labId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "TrainingNode" ADD CONSTRAINT "TrainingNode_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
