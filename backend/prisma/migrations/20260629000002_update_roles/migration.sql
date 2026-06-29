-- Add roles array column
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" TEXT[] NOT NULL DEFAULT ARRAY['USER'];

-- Migrate existing role data
UPDATE "User" SET "roles" = ARRAY['GLOBAL_ADMIN'] WHERE "role" = 'ADMIN';
-- USER stays as ['USER'] (already the default)

-- Drop old single-value role column
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- Drop the old enum type
DROP TYPE IF EXISTS "Role" CASCADE;
