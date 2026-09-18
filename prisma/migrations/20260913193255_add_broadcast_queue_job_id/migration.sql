-- AlterTable
ALTER TABLE "broadcasts" ADD COLUMN     "queueJobId" TEXT;

-- CreateIndex
CREATE INDEX "broadcasts_queueJobId_idx" ON "broadcasts"("queueJobId");
