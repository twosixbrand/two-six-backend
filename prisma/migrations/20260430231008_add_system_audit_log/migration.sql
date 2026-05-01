-- CreateTable
CREATE TABLE "system_audit_log" (
    "id" BIGSERIAL NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_audit_log_table_name_record_id_idx" ON "system_audit_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "system_audit_log_created_at_idx" ON "system_audit_log"("created_at");

-- CreateIndex
CREATE INDEX "system_audit_log_user_id_idx" ON "system_audit_log"("user_id");
