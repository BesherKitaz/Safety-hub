/*
  Warnings:

  - A unique constraint covering the columns `[issuedToId,labId,toolId]` on the table `Certification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Certification_issuedToId_labId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Certification_issuedToId_labId_toolId_key" ON "Certification"("issuedToId", "labId", "toolId");
