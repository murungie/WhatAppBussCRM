-- AlterTable
ALTER TABLE "broadcasts" ADD COLUMN     "deliveredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "readCount" INTEGER NOT NULL DEFAULT 0;
