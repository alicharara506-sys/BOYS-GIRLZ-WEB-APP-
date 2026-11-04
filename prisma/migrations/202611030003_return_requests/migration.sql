ALTER TABLE "Return" ADD COLUMN "requestKey" TEXT;
UPDATE "Return" SET "requestKey" = id WHERE "requestKey" IS NULL;
ALTER TABLE "Return" ALTER COLUMN "requestKey" SET NOT NULL;
CREATE UNIQUE INDEX "Return_requestKey_key" ON "Return"("requestKey");
