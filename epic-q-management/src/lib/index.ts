// Re-export all commonly used modules
export { withAuth, withAdminAuth, withCoordinatorAuth } from './auth/middleware';
export type { AuthContext } from './auth/middleware';
export { prisma, connectDatabase, disconnectDatabase, checkDatabaseConnection, getDatabaseStats, getDatabaseInfo, clearDatabase } from './db-connection';
export * from './database';
export * from './auth/auth-service';
export * from './auth/simple-auth-service';
export { withAdminAuth as withSimpleAdminAuth } from './auth/simple-middleware';
export * from './auth/types';
