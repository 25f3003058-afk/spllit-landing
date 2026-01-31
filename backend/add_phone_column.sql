-- Add phone column to User table if it doesn't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Optional: Update existing users with a placeholder if needed
-- UPDATE "User" SET "phone" = '+91XXXXXXXXXX' WHERE "phone" IS NULL;
