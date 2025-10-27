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

// Export default para compatibilidad
export { default } from './db-connection';
