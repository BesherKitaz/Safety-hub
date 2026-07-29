-- DropForeignKey
ALTER TABLE "CertificationHistory" DROP CONSTRAINT "CertificationHistory_changedById_fkey";

-- AlterTable
ALTER TABLE "CertificationSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
