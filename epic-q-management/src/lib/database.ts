// Re-exportar desde db-connection para mantener compatibilidad
export {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseConnection,
  getDatabaseStats,
  getDatabaseInfo,
  clearDatabase
} from './db-connection';

export { default } from './db-connection';
