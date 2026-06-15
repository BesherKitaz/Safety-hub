/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[issuedToId,labId]` on the table `Certification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `labId` to the `Certification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';

-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_categoryId_fkey";

-- DropIndex
DROP INDEX "Certification_categoryId_idx";

-- DropIndex
DROP INDEX "Certification_issuedToId_categoryId_idx";

-- DropIndex
DROP INDEX "Certification_issuedToId_categoryId_level_key";

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "categoryId",
DROP COLUMN "level",
ADD COLUMN     "labId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Category";

-- DropEnum
DROP TYPE "CertificationLevel";

-- CreateTable
CREATE TABLE "Lab" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "labId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lab_name_key" ON "Lab"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_name_key" ON "Tool"("name");

-- CreateIndex
CREATE INDEX "Certification_labId_idx" ON "Certification"("labId");

-- CreateIndex
CREATE INDEX "Certification_issuedToId_labId_idx" ON "Certification"("issuedToId", "labId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_issuedToId_labId_key" ON "Certification"("issuedToId", "labId");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
