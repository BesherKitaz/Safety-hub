/*
  Warnings:

  - You are about to drop the column `revokeReason` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `revokedById` on the `Certification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Certification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CertificationHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'REVOKED', 'REACTIVATED', 'EXPIRED', 'DEACTIVATED');

-- DropForeignKey
ALTER TABLE "Certification" DROP CONSTRAINT "Certification_revokedById_fkey";

-- AlterTable
ALTER TABLE "Certification" DROP COLUMN "revokeReason",
DROP COLUMN "revokedAt",
DROP COLUMN "revokedById",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "CertificationHistory" (
    "id" TEXT NOT NULL,
    "certificationId" TEXT NOT NULL,
    "levelBefore" INTEGER NOT NULL,
    "statusBefore" "CertificationStatus" NOT NULL,
    "expiryDateBefore" TIMESTAMP(3),
    "notesBefore" TEXT,
    "trainingNodeIdBefore" TEXT NOT NULL,
    "action" "CertificationHistoryAction" NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "CertificationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificationHistory_certificationId_idx" ON "CertificationHistory"("certificationId");

-- CreateIndex
CREATE INDEX "CertificationHistory_changedById_idx" ON "CertificationHistory"("changedById");

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_trainingNodeIdBefore_fkey" FOREIGN KEY ("trainingNodeIdBefore") REFERENCES "TrainingNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
