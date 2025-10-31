-- Migración para Centro de Documentación
-- Aplicar cambios sin perder datos existentes

-- 1. Agregar nuevos campos a project_resources si no existen
DO $$ 
BEGIN
  -- Agregar category si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'project_resources' AND column_name = 'category') THEN
    ALTER TABLE project_resources ADD COLUMN category TEXT;
  END IF;

  -- Agregar tags si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'project_resources' AND column_name = 'tags') THEN
    ALTER TABLE project_resources ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Agregar searchable_content si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'project_resources' AND column_name = 'searchable_content') THEN
    ALTER TABLE project_resources ADD COLUMN searchable_content TEXT;
  END IF;

  -- Agregar current_version si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'project_resources' AND column_name = 'current_version') THEN
    ALTER TABLE project_resources ADD COLUMN current_version INTEGER DEFAULT 1;
  END IF;

  -- Agregar is_latest si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'project_resources' AND column_name = 'is_latest') THEN
    ALTER TABLE project_resources ADD COLUMN is_latest BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. Crear índices si no existen
CREATE INDEX IF NOT EXISTS project_resources_category_idx ON project_resources(category);
CREATE INDEX IF NOT EXISTS project_resources_is_active_idx ON project_resources(is_active);
CREATE INDEX IF NOT EXISTS project_resources_created_at_idx ON project_resources(created_at);

-- 3. Crear tabla de versiones de recursos si no existe
CREATE TABLE IF NOT EXISTS resource_versions (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  s3_key TEXT,
  file_size INTEGER,
  mime_type TEXT,
  change_notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resource_versions_resource_id_fkey FOREIGN KEY (resource_id) 
    REFERENCES project_resources(id) ON DELETE CASCADE,
  CONSTRAINT resource_versions_created_by_fkey FOREIGN KEY (created_by) 
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT resource_versions_unique_version UNIQUE (resource_id, version_number)
);

-- 4. Crear índices para resource_versions
CREATE INDEX IF NOT EXISTS resource_versions_resource_id_idx ON resource_versions(resource_id);
CREATE INDEX IF NOT EXISTS resource_versions_created_at_idx ON resource_versions(created_at);

-- 5. Crear tabla de logs de acceso a recursos si no existe
CREATE TABLE IF NOT EXISTS resource_access_logs (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  user_id TEXT,
  access_type TEXT NOT NULL DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT resource_access_logs_resource_id_fkey FOREIGN KEY (resource_id) 
    REFERENCES project_resources(id) ON DELETE CASCADE,
  CONSTRAINT resource_access_logs_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Crear índices para resource_access_logs
CREATE INDEX IF NOT EXISTS resource_access_logs_resource_id_idx ON resource_access_logs(resource_id);
CREATE INDEX IF NOT EXISTS resource_access_logs_user_id_idx ON resource_access_logs(user_id);
CREATE INDEX IF NOT EXISTS resource_access_logs_accessed_at_idx ON resource_access_logs(accessed_at);
CREATE INDEX IF NOT EXISTS resource_access_logs_access_type_idx ON resource_access_logs(access_type);

-- 7. Actualizar valores por defecto para recursos existentes
UPDATE project_resources 
SET current_version = 1, is_latest = true, tags = '{}'
WHERE current_version IS NULL OR is_latest IS NULL OR tags IS NULL;
