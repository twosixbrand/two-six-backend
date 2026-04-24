-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE INDEX "order_id_customer_idx" ON "order"("id_customer");

-- CreateIndex
CREATE INDEX "product_sku_idx" ON "product"("sku");

-- CreateIndex
CREATE INDEX "customer_email_idx" ON "customer"("email");

-- CreateIndex
CREATE INDEX "customer_document_number_idx" ON "customer"("document_number");

-- CreateIndex
CREATE INDEX "clothing_color_slug_idx" ON "clothing_color"("slug");

-- CreateIndex
CREATE INDEX "dian_e_invoicing_id_order_idx" ON "dian_e_invoicing"("id_order");

-- CreateIndex
CREATE INDEX "dian_e_invoicing_document_number_idx" ON "dian_e_invoicing"("document_number");
