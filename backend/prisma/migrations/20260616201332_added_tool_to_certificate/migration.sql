-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "toolId" TEXT;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
