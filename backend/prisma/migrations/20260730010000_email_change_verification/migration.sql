ALTER TABLE "EmailVerificationToken"
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'SIGNUP',
ADD COLUMN "userId" TEXT;

CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
