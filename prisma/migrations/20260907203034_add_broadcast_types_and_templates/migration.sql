-- CreateEnum
CREATE TYPE "BroadcastType" AS ENUM ('TEXT', 'TEMPLATE');

-- AlterTable
ALTER TABLE "broadcasts" ADD COLUMN     "templateLanguage" TEXT,
ADD COLUMN     "templateName" TEXT,
ADD COLUMN     "templateParameters" JSONB,
ADD COLUMN     "type" "BroadcastType" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "message" DROP NOT NULL;
