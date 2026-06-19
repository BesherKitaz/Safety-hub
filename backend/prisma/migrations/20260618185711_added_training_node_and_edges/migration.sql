/*
  Warnings:

  - You are about to drop the column `labId` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `toolId` on the `Certification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[issuedToId,trainingNodeId,level]` on the table `Certification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trainingNodeId` to the `Certification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrainingNodeType" AS ENUM ('GENERAL', 'LAB', 'TOOL');

-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_labId_fkey";

-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_toolId_fkey";

-- DropIndex
DROP INDEX "Certification_issuedToId_labId_idx";

-- DropIndex
DROP INDEX "Certification_issuedToId_labId_toolId_key";

-- DropIndex
DROP INDEX "Certification_labId_idx";

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "labId",
DROP COLUMN "toolId",
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "trainingNodeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TrainingNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TrainingNodeType" NOT NULL,
    "labId" TEXT,
    "toolId" TEXT,

    CONSTRAINT "TrainingNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEdge" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "TrainingEdge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingNode_toolId_key" ON "TrainingNode"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEdge_parentId_childId_key" ON "TrainingEdge"("parentId", "childId");

-- CreateIndex
CREATE INDEX "Certification_issuedToId_idx" ON "Certification"("issuedToId");

-- CreateIndex
CREATE INDEX "Certification_trainingNodeId_idx" ON "Certification"("trainingNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_issuedToId_trainingNodeId_level_key" ON "Certification"("issuedToId", "trainingNodeId", "level");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_trainingNodeId_fkey" FOREIGN KEY ("trainingNodeId") REFERENCES "TrainingNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNode" ADD CONSTRAINT "TrainingNode_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingNode" ADD CONSTRAINT "TrainingNode_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEdge" ADD CONSTRAINT "TrainingEdge_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TrainingNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEdge" ADD CONSTRAINT "TrainingEdge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "TrainingNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
