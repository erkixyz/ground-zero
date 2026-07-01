-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_clientId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "clientId";
ALTER TABLE "User" ADD COLUMN "organisationId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
