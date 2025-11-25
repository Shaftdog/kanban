-- DropIndex
-- Remove the global unique constraint on columns.key
DROP INDEX "columns_key_key";

-- CreateIndex
-- Add a composite unique constraint on (userId, key) to allow each user to have their own set of columns
CREATE UNIQUE INDEX "columns_userId_key_key" ON "columns"("userId", "key");
