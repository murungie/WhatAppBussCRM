-- AlterTable
ALTER TABLE "broadcast_recipients" ADD COLUMN     "deliveryStatus" "MessageStatus";

-- CreateIndex
CREATE INDEX "broadcast_recipients_deliveryStatus_idx" ON "broadcast_recipients"("deliveryStatus");
