/*
  Warnings:

  - Added the required column `updatedAt` to the `auto_reply_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "auto_reply_rules_keyword_idx";

-- AlterTable
ALTER TABLE "auto_reply_rules" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "auto_reply_rules_isActive_idx" ON "auto_reply_rules"("isActive");
