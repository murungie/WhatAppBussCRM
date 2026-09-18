/*
  Warnings:

  - A unique constraint covering the columns `[waMessageId]` on the table `broadcast_recipients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[queueJobId]` on the table `broadcasts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[whatsappPhoneId]` on the table `businesses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[businessId,waMessageId]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "broadcast_recipients_broadcastId_idx";

-- DropIndex
DROP INDEX "customers_businessId_idx";

-- CreateIndex
CREATE INDEX "broadcast_recipients_broadcastId_status_idx" ON "broadcast_recipients"("broadcastId", "status");

-- CreateIndex
CREATE INDEX "broadcast_recipients_broadcastId_deliveryStatus_idx" ON "broadcast_recipients"("broadcastId", "deliveryStatus");

-- CreateIndex
CREATE UNIQUE INDEX "broadcast_recipients_waMessageId_key" ON "broadcast_recipients"("waMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "broadcasts_queueJobId_key" ON "broadcasts"("queueJobId");

-- CreateIndex
CREATE INDEX "broadcasts_businessId_createdAt_idx" ON "broadcasts"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "broadcasts_status_scheduledAt_idx" ON "broadcasts"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_whatsappPhoneId_key" ON "businesses"("whatsappPhoneId");

-- CreateIndex
CREATE INDEX "customers_businessId_updatedAt_idx" ON "customers"("businessId", "updatedAt");

-- CreateIndex
CREATE INDEX "messages_businessId_customerId_createdAt_idx" ON "messages"("businessId", "customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "messages_businessId_waMessageId_key" ON "messages"("businessId", "waMessageId");
