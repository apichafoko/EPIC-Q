// Configuración de base de datos para diferentes entornos
export const dbConfig = {
  // Configuración para PostgreSQL local
  postgresql: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'epicq_db',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
  },
  
  // Configuración para Neon
  neon: {
    url: process.env.DATABASE_URL,
  },
  
  // Tipo de base de datos a usar
  provider: process.env.DB_PROVIDER || 'postgresql', // 'postgresql' o 'neon'
  
  // Configuración de conexión
  connection: {
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '60000'),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  },
  
  // Configuración de logging
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    level: process.env.DB_LOG_LEVEL || 'query',
  },
  
  // Configuración de migraciones
  migrations: {
    autoRun: process.env.DB_AUTO_MIGRATE === 'true',
    backupBeforeMigrate: process.env.DB_BACKUP_BEFORE_MIGRATE === 'true',
  },
  
  // Configuración de alertas
  alerts: {
    inactivityDays: parseInt(process.env.ALERT_INACTIVITY_DAYS || '30'),
    lowCompletionThreshold: parseInt(process.env.ALERT_LOW_COMPLETION_THRESHOLD || '70'),
    upcomingPeriodDays: parseInt(process.env.ALERT_UPCOMING_PERIOD_DAYS || '7'),
  },
  
  // Configuración de backup
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Diario a las 2 AM
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  }
};

// Función para obtener la URL de conexión
export function getDatabaseUrl(): string {
  if (dbConfig.provider === 'neon' && dbConfig.neon.url) {
    return dbConfig.neon.url;
  }
  
  // Construir URL para PostgreSQL local
  const { host, port, database, username, password } = dbConfig.postgresql;
  return `postgresql://${username}:${password}@${host}:${port}/${database}?schema=public`;
}

// Función para verificar la configuración
export function validateDatabaseConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (dbConfig.provider === 'neon') {
    if (!dbConfig.neon.url) {
      errors.push('DATABASE_URL es requerida para Neon');
    }
  } else {
    if (!dbConfig.postgresql.host) {
      errors.push('POSTGRES_HOST es requerido para PostgreSQL local');
    }
    if (!dbConfig.postgresql.database) {
      errors.push('POSTGRES_DB es requerido para PostgreSQL local');
    }
    if (!dbConfig.postgresql.username) {
      errors.push('POSTGRES_USER es requerido para PostgreSQL local');
    }
    if (!dbConfig.postgresql.password) {
      errors.push('POSTGRES_PASSWORD es requerido para PostgreSQL local');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Función para obtener configuración de conexión para Prisma
export function getPrismaConfig() {
  const provider = dbConfig.provider;
  
  if (provider === 'neon') {
    return {
      datasources: {
        db: {
          url: dbConfig.neon.url,
        },
      },
      log: dbConfig.logging.enabled ? [dbConfig.logging.level] : ['error'],
    };
  }
  
  return {
    log: dbConfig.logging.enabled ? [dbConfig.logging.level] : ['error'],
  };
}

// Función para obtener configuración de conexión para pg (PostgreSQL nativo)
export function getPgConfig() {
  if (dbConfig.provider === 'neon') {
    return {
      connectionString: dbConfig.neon.url,
      ssl: { rejectUnauthorized: false },
    };
  }
  
  return {
    host: dbConfig.postgresql.host,
    port: dbConfig.postgresql.port,
    database: dbConfig.postgresql.database,
    user: dbConfig.postgresql.username,
    password: dbConfig.postgresql.password,
    max: dbConfig.connection.maxConnections,
    connectionTimeoutMillis: dbConfig.connection.connectionTimeout,
    idleTimeoutMillis: dbConfig.connection.idleTimeout,
  };
}

// Función para obtener información de configuración
export function getConfigInfo() {
  return {
    provider: dbConfig.provider,
    environment: process.env.NODE_ENV || 'development',
    logging: dbConfig.logging,
    connection: dbConfig.connection,
    alerts: dbConfig.alerts,
    backup: dbConfig.backup,
    validation: validateDatabaseConfig(),
  };
}