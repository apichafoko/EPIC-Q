-- Migración segura para agregar scheduled_reports, report_history y security_logs
-- Este script es seguro de ejecutar, no borra datos existentes
-- Usa CREATE TABLE IF NOT EXISTS para evitar errores si las tablas ya existen

-- Tabla scheduled_reports
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

-- Tabla report_history
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

-- Tabla security_logs
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

-- Crear índices solo si no existen
CREATE INDEX IF NOT EXISTS "scheduled_reports_is_active_next_run_at_idx" 
    ON "scheduled_reports"("is_active", "next_run_at");

CREATE INDEX IF NOT EXISTS "scheduled_reports_created_by_idx" 
    ON "scheduled_reports"("created_by");

CREATE INDEX IF NOT EXISTS "report_history_scheduled_report_id_idx" 
    ON "report_history"("scheduled_report_id");

CREATE INDEX IF NOT EXISTS "report_history_generated_at_idx" 
    ON "report_history"("generated_at");

CREATE INDEX IF NOT EXISTS "security_logs_event_type_idx" 
    ON "security_logs"("event_type");

CREATE INDEX IF NOT EXISTS "security_logs_severity_idx" 
    ON "security_logs"("severity");

CREATE INDEX IF NOT EXISTS "security_logs_user_id_idx" 
    ON "security_logs"("user_id");

CREATE INDEX IF NOT EXISTS "security_logs_ip_address_idx" 
    ON "security_logs"("ip_address");

CREATE INDEX IF NOT EXISTS "security_logs_created_at_idx" 
    ON "security_logs"("created_at");

-- Agregar foreign keys solo si no existen
-- Verificar si la constraint ya existe antes de agregarla
DO $$ 
BEGIN
    -- Foreign key para scheduled_reports.created_by -> users.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scheduled_reports_created_by_fkey'
    ) THEN
        ALTER TABLE "scheduled_reports" 
        ADD CONSTRAINT "scheduled_reports_created_by_fkey" 
        FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Foreign key para report_history.scheduled_report_id -> scheduled_reports.id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'report_history_scheduled_report_id_fkey'
    ) THEN
        ALTER TABLE "report_history" 
        ADD CONSTRAINT "report_history_scheduled_report_id_fkey" 
        FOREIGN KEY ("scheduled_report_id") REFERENCES "scheduled_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Verificar que todo se creó correctamente
SELECT 
    'scheduled_reports' as table_name,
    COUNT(*) as rows_count
FROM "scheduled_reports"
UNION ALL
SELECT 
    'report_history' as table_name,
    COUNT(*) as rows_count
FROM "report_history"
UNION ALL
SELECT 
    'security_logs' as table_name,
    COUNT(*) as rows_count
FROM "security_logs";

