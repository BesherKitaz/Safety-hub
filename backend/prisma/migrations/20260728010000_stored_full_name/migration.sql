ALTER TABLE "User"
ADD COLUMN "fullName" TEXT GENERATED ALWAYS AS (
  btrim("firstName" || ' ' || "lastName")
) STORED;
