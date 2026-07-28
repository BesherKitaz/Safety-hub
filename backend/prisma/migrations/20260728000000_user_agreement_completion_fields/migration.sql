ALTER TABLE "User"
ADD COLUMN "userAgreementCompletedAt" TIMESTAMP(3),
ADD COLUMN "userAgreementSignature" TEXT,
ADD COLUMN "userAgreementAcknowledgements" JSONB;

CREATE TABLE "AgreementLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementLink_pkey" PRIMARY KEY ("id")
);
