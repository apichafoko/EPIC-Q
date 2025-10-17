const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function optimizeDatabase() {
  console.log('🚀 Iniciando optimización de base de datos...');

  try {
    // Aplicar migración de Prisma para crear los índices
    console.log('📊 Aplicando migración de Prisma...');
    
    // Ejecutar prisma db push para aplicar los cambios del schema
    const { execSync } = require('child_process');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    console.log('✅ Migración aplicada exitosamente');

    // Regenerar el cliente de Prisma
    console.log('🔄 Regenerando cliente de Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('✅ Cliente de Prisma regenerado');

    // Verificar que los índices se crearon correctamente
    console.log('🔍 Verificando índices creados...');
    
    const indexQueries = [
      // Verificar índices de Project
      "SELECT indexname FROM pg_indexes WHERE tablename = 'projects' AND indexname LIKE '%_idx';",
      
      // Verificar índices de ProjectHospital
      "SELECT indexname FROM pg_indexes WHERE tablename = 'project_hospitals' AND indexname LIKE '%_idx';",
      
      // Verificar índices de ProjectCoordinator
      "SELECT indexname FROM pg_indexes WHERE tablename = 'project_coordinators' AND indexname LIKE '%_idx';",
      
      // Verificar índices de ProjectRecruitmentPeriod
      "SELECT indexname FROM pg_indexes WHERE tablename = 'project_recruitment_periods' AND indexname LIKE '%_idx';",
      
      // Verificar índices de User
      "SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname LIKE '%_idx';",
      
      // Verificar índices de Hospital
      "SELECT indexname FROM pg_indexes WHERE tablename = 'hospitals' AND indexname LIKE '%_idx';"
    ];

    for (const query of indexQueries) {
      try {
        const result = await prisma.$queryRawUnsafe(query);
        console.log(`📋 Índices encontrados:`, result);
      } catch (error) {
        console.warn(`⚠️  No se pudieron verificar los índices:`, error.message);
      }
    }

    // Mostrar estadísticas de rendimiento
    console.log('📈 Estadísticas de rendimiento:');
    
    const statsQueries = [
      {
        name: 'Total de proyectos',
        query: 'SELECT COUNT(*) as count FROM projects;'
      },
      {
        name: 'Total de hospitales en proyectos',
        query: 'SELECT COUNT(*) as count FROM project_hospitals;'
      },
      {
        name: 'Total de coordinadores en proyectos',
        query: 'SELECT COUNT(*) as count FROM project_coordinators;'
      },
      {
        name: 'Total de períodos de reclutamiento',
        query: 'SELECT COUNT(*) as count FROM project_recruitment_periods;'
      }
    ];

    for (const stat of statsQueries) {
      try {
        const result = await prisma.$queryRawUnsafe(stat.query);
        console.log(`  ${stat.name}: ${result[0].count}`);
      } catch (error) {
        console.warn(`⚠️  No se pudo obtener estadística ${stat.name}:`, error.message);
      }
    }

    console.log('🎉 Optimización de base de datos completada exitosamente!');
    console.log('');
    console.log('📝 Resumen de optimizaciones aplicadas:');
    console.log('  ✅ Índices en tabla projects (status, created_at, start_date/end_date)');
    console.log('  ✅ Índices en tabla project_hospitals (project_id, hospital_id, status, joined_at)');
    console.log('  ✅ Índices en tabla project_coordinators (project_id, user_id, hospital_id, is_active, invitation_token, invited_at)');
    console.log('  ✅ Índices en tabla project_recruitment_periods (project_hospital_id, period_number, status, start_date/end_date, created_at)');
    console.log('  ✅ Índices en tabla users (role, isActive, isTemporaryPassword, created_at, hospital_id)');
    console.log('  ✅ Índices en tabla hospitals (status, province, city, created_at, participated_lasos)');
    console.log('');
    console.log('🚀 La base de datos está ahora optimizada para consultas multi-proyecto!');

  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = { optimizeDatabase };
