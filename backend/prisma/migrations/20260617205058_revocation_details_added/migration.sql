-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedById" TEXT,
ADD COLUMN     "status" "CertificationStatus" NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
