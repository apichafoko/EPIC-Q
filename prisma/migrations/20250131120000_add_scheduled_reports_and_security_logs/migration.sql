-- CreateTable
CREATE TABLE IF NOT EXISTS "scheduled_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "report_type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'pdf',
    "recipients" TEXT[],
    "filters" JSONB,
    "template_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "report_history" (
    "id" TEXT NOT NULL,
    "scheduled_report_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" TEXT,
    "file_size" INTEGER,
    "error_message" TEXT,
    "recipients_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "report_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "security_logs" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scheduled_reports_is_active_next_run_at_idx" ON "scheduled_reports"("is_active", "next_run_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "scheduled_reports_created_by_idx" ON "scheduled_reports"("created_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "report_history_scheduled_report_id_idx" ON "report_history"("scheduled_report_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "report_history_generated_at_idx" ON "report_history"("generated_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_logs_event_type_idx" ON "security_logs"("event_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_logs_severity_idx" ON "security_logs"("severity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_logs_user_id_idx" ON "security_logs"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_logs_ip_address_idx" ON "security_logs"("ip_address");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_logs_created_at_idx" ON "security_logs"("created_at");

-- AddForeignKey
ALTER TABLE "scheduled_reports" ADD CONSTRAINT "scheduled_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_scheduled_report_id_fkey" FOREIGN KEY ("scheduled_report_id") REFERENCES "scheduled_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;


