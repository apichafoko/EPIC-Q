// Configuración de variables de entorno para base de datos
export const dbEnv = {
  // Variables principales
  DATABASE_URL: process.env.DATABASE_URL,
  DB_PROVIDER: process.env.DB_PROVIDER || 'postgresql',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Variables para PostgreSQL local
  POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
  POSTGRES_PORT: process.env.POSTGRES_PORT || '5432',
  POSTGRES_DB: process.env.POSTGRES_DB || 'epicq_db',
  POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  
  // Variables de configuración
  DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS || '10',
  DB_CONNECTION_TIMEOUT: process.env.DB_CONNECTION_TIMEOUT || '60000',
  DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT || '30000',
  DB_LOG_LEVEL: process.env.DB_LOG_LEVEL || 'query',
  DB_AUTO_MIGRATE: process.env.DB_AUTO_MIGRATE || 'false',
  DB_BACKUP_BEFORE_MIGRATE: process.env.DB_BACKUP_BEFORE_MIGRATE || 'false',
  
  // Variables de alertas
  ALERT_INACTIVITY_DAYS: process.env.ALERT_INACTIVITY_DAYS || '30',
  ALERT_LOW_COMPLETION_THRESHOLD: process.env.ALERT_LOW_COMPLETION_THRESHOLD || '70',
  ALERT_UPCOMING_PERIOD_DAYS: process.env.ALERT_UPCOMING_PERIOD_DAYS || '7',
  
  // Variables de backup
  BACKUP_ENABLED: process.env.BACKUP_ENABLED || 'false',
  BACKUP_SCHEDULE: process.env.BACKUP_SCHEDULE || '0 2 * * *',
  BACKUP_RETENTION_DAYS: process.env.BACKUP_RETENTION_DAYS || '30',
  
  // Variables de aplicación
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // Variables de email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // Variables de RedCap
  REDCAP_API_URL: process.env.REDCAP_API_URL,
  REDCAP_API_TOKEN: process.env.REDCAP_API_TOKEN,
};

// Función para validar variables de entorno requeridas
export function validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Función para validar configuración de base de datos
export function validateDatabaseEnvVars(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (dbEnv.DB_PROVIDER === 'neon') {
    if (!dbEnv.DATABASE_URL) {
      errors.push('DATABASE_URL es requerida para Neon');
    }
  } else {
    if (!dbEnv.POSTGRES_HOST) {
      errors.push('POSTGRES_HOST es requerido para PostgreSQL local');
    }
    if (!dbEnv.POSTGRES_DB) {
      errors.push('POSTGRES_DB es requerido para PostgreSQL local');
    }
    if (!dbEnv.POSTGRES_USER) {
      errors.push('POSTGRES_USER es requerido para PostgreSQL local');
    }
    if (!dbEnv.POSTGRES_PASSWORD) {
      errors.push('POSTGRES_PASSWORD es requerido para PostgreSQL local');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Función para obtener configuración de base de datos
export function getDatabaseConfig() {
  const provider = dbEnv.DB_PROVIDER;
  
  if (provider === 'neon') {
    return {
      provider: 'neon',
      url: dbEnv.DATABASE_URL,
      ssl: true,
    };
  }
  
  return {
    provider: 'postgresql',
    host: dbEnv.POSTGRES_HOST,
    port: parseInt(dbEnv.POSTGRES_PORT),
    database: dbEnv.POSTGRES_DB,
    username: dbEnv.POSTGRES_USER,
    password: dbEnv.POSTGRES_PASSWORD,
    ssl: false,
  };
}

// Función para obtener configuración de logging
export function getLoggingConfig() {
  return {
    enabled: dbEnv.NODE_ENV === 'development',
    level: dbEnv.DB_LOG_LEVEL,
    maxConnections: parseInt(dbEnv.DB_MAX_CONNECTIONS),
    connectionTimeout: parseInt(dbEnv.DB_CONNECTION_TIMEOUT),
    idleTimeout: parseInt(dbEnv.DB_IDLE_TIMEOUT),
  };
}

// Función para obtener configuración de alertas
export function getAlertsConfig() {
  return {
    inactivityDays: parseInt(dbEnv.ALERT_INACTIVITY_DAYS),
    lowCompletionThreshold: parseInt(dbEnv.ALERT_LOW_COMPLETION_THRESHOLD),
    upcomingPeriodDays: parseInt(dbEnv.ALERT_UPCOMING_PERIOD_DAYS),
  };
}

// Función para obtener configuración de backup
export function getBackupConfig() {
  return {
    enabled: dbEnv.BACKUP_ENABLED === 'true',
    schedule: dbEnv.BACKUP_SCHEDULE,
    retentionDays: parseInt(dbEnv.BACKUP_RETENTION_DAYS),
  };
}

// Función para mostrar configuración (sin credenciales)
export function getConfigSummary() {
  const dbConfig = getDatabaseConfig();
  const loggingConfig = getLoggingConfig();
  const alertsConfig = getAlertsConfig();
  const backupConfig = getBackupConfig();
  
  return {
    environment: dbEnv.NODE_ENV,
    database: {
      provider: dbConfig.provider,
      host: dbConfig.host || 'Neon',
      port: dbConfig.port || 'N/A',
      database: dbConfig.database,
      ssl: dbConfig.ssl,
    },
    logging: loggingConfig,
    alerts: alertsConfig,
    backup: backupConfig,
    validation: {
      required: validateRequiredEnvVars(),
      database: validateDatabaseEnvVars(),
    }
  };
}
