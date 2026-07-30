CREATE TABLE "College" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserAcademicAffiliation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserAcademicAffiliation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "College_name_key" ON "College"("name");
CREATE UNIQUE INDEX "Department_collegeId_name_key" ON "Department"("collegeId", "name");
CREATE INDEX "Department_collegeId_idx" ON "Department"("collegeId");
CREATE UNIQUE INDEX "UserAcademicAffiliation_userId_departmentId_key" ON "UserAcademicAffiliation"("userId", "departmentId");
CREATE INDEX "UserAcademicAffiliation_collegeId_idx" ON "UserAcademicAffiliation"("collegeId");
CREATE INDEX "UserAcademicAffiliation_departmentId_idx" ON "UserAcademicAffiliation"("departmentId");

ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey"
FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAcademicAffiliation" ADD CONSTRAINT "UserAcademicAffiliation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAcademicAffiliation" ADD CONSTRAINT "UserAcademicAffiliation_collegeId_fkey"
FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAcademicAffiliation" ADD CONSTRAINT "UserAcademicAffiliation_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
