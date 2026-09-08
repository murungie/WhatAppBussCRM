-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "messages_status_idx" ON "messages"("status");
