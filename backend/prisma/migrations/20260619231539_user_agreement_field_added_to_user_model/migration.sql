-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isUserAgreementComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userAgreementSource" TEXT;
