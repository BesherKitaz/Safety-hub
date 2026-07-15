/*
  Warnings:

  - Added the required column `levelAfter` to the `CertificationHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusAfter` to the `CertificationHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trainingNodeIdAfter` to the `CertificationHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CertificationHistory" ADD COLUMN     "expiryDateAfter" TIMESTAMP(3),
ADD COLUMN     "levelAfter" INTEGER NOT NULL,
ADD COLUMN     "notesAfter" TEXT,
ADD COLUMN     "statusAfter" "CertificationStatus" NOT NULL,
ADD COLUMN     "trainingNodeIdAfter" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CertificationHistory" ADD CONSTRAINT "CertificationHistory_trainingNodeIdAfter_fkey" FOREIGN KEY ("trainingNodeIdAfter") REFERENCES "TrainingNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
