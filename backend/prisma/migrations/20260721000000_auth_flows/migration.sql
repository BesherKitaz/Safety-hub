ALTER TABLE "EmailVerificationToken" ADD COLUMN "requestTokenHash" TEXT;

CREATE UNIQUE INDEX "EmailVerificationToken_requestTokenHash_key"
ON "EmailVerificationToken"("requestTokenHash");

CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "requestTokenHash" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX "PasswordResetToken_requestTokenHash_key" ON "PasswordResetToken"("requestTokenHash");
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");
