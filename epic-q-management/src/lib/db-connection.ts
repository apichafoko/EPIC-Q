import { PrismaClient } from '@prisma/client';

// Configuración de conexión
const createPrismaClient = () => {
  const provider = process.env.DB_PROVIDER || 'postgresql';
  
  // Configuración específica para Neon
  if (provider === 'neon') {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  
  // Configuración para PostgreSQL local
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Singleton pattern para el cliente de Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para conectar a la base de datos
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Base de datos conectada exitosamente');
    
    // Verificar el proveedor
    const provider = process.env.DB_PROVIDER || 'postgresql';
    console.log(`📊 Usando proveedor: ${provider}`);
    
    // Verificar conexión con una consulta simple
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión verificada');
    
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    throw error;
  }
}

// Función para desconectar de la base de datos
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de la base de datos');
  } catch (error) {
    console.error('❌ Error al desconectar de la base de datos:', error);
    throw error;
  }
}

// Función para verificar la conexión
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { success: true, message: 'Conexión exitosa' };
  } catch (error) {
    return { success: false, message: `Error de conexión: ${error}` };
  }
}

// Función para obtener información de la base de datos
export async function getDatabaseInfo() {
  try {
    const provider = process.env.DB_PROVIDER || 'postgresql';
    const version = await prisma.$queryRaw`SELECT version()`;
    const currentTime = await prisma.$queryRaw`SELECT NOW()`;
    
    return {
      provider,
      version: version[0]?.version || 'Unknown',
      currentTime: currentTime[0]?.now || new Date(),
      connected: true
    };
  } catch (error) {
    return {
      provider: process.env.DB_PROVIDER || 'postgresql',
      version: 'Unknown',
      currentTime: new Date(),
      connected: false,
      error: error
    };
  }
}

// Función para obtener estadísticas de la base de datos
export async function getDatabaseStats() {
  try {
    const [
      hospitalCount,
      contactCount,
      communicationCount,
      templateCount,
      userCount,
      alertCount
    ] = await Promise.all([
      prisma.hospitals.count(),
      prisma.contact.count(),
      prisma.communications.count(),
      prisma.communication_templates.count(),
      prisma.users.count(),
      prisma.alerts.count()
    ]);

    return {
      hospitals: hospitalCount,
      contacts: contactCount,
      communications: communicationCount,
      templates: templateCount,
      users: userCount,
      alerts: alertCount,
      total: hospitalCount + contactCount + communicationCount + templateCount + userCount + alertCount
    };
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    throw error;
  }
}

// Función para limpiar la base de datos
export async function clearDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    await prisma.activity_logs.deleteMany();
    await prisma.communications.deleteMany();
    await prisma.case_metrics.deleteMany();
    await prisma.recruitment_periods.deleteMany();
    await prisma.hospital_progress.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.hospital_details.deleteMany();
    await prisma.hospitals.deleteMany();
    await prisma.communication_templates.deleteMany();
    await prisma.alerts.deleteMany();
    await prisma.users.deleteMany();

    console.log('✅ Base de datos limpiada exitosamente');
    return { success: true, message: 'Base de datos limpiada' };
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    return { success: false, error: error };
  }
}

export default prisma;
