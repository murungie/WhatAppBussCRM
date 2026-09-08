-- CreateIndex
CREATE INDEX "auto_reply_rules_keyword_idx" ON "auto_reply_rules"("keyword");

-- CreateIndex
CREATE INDEX "broadcasts_scheduledAt_idx" ON "broadcasts"("scheduledAt");

-- CreateIndex
CREATE INDEX "customers_businessId_idx" ON "customers"("businessId");

-- CreateIndex
CREATE INDEX "customers_phoneNumber_idx" ON "customers"("phoneNumber");

-- CreateIndex
CREATE INDEX "messages_waMessageId_idx" ON "messages"("waMessageId");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");
