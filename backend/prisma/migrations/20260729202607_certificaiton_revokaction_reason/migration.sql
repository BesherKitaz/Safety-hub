-- DropForeignKey
ALTER TABLE "CertificationHistory" DROP CONSTRAINT "CertificationHistory_trainingNodeIdBefore_fkey";

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_trainingNodeIdBefore_fkey" FOREIGN KEY ("trainingNodeIdBefore") REFERENCES "TrainingNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
