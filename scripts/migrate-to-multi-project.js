const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToMultiProject() {
  console.log('🚀 Iniciando migración a arquitectura multi-proyecto...');

  try {
    // 1. Crear proyecto "EPIC-Q Original" (default)
    console.log('📋 Creando proyecto por defecto...');
    const defaultProject = await prisma.project.create({
      data: {
        name: 'EPIC-Q Original',
        description: 'Proyecto migrado desde la arquitectura anterior',
        status: 'active',
        start_date: new Date('2024-01-01'),
        total_target_cases: 1000
      }
    });
    console.log(`✅ Proyecto creado: ${defaultProject.id}`);

    // 2. Obtener todos los hospitales existentes
    console.log('🏥 Obteniendo hospitales existentes...');
    const hospitals = await prisma.hospital.findMany({
      include: {
        progress: true,
        recruitment_periods: true,
        users: {
          where: { role: 'coordinator' }
        }
      }
    });
    console.log(`📊 Encontrados ${hospitals.length} hospitales`);

    // 3. Migrar cada hospital a ProjectHospital
    console.log('🔄 Migrando hospitales a ProjectHospital...');
    for (const hospital of hospitals) {
      console.log(`  - Migrando hospital: ${hospital.name}`);
      
      // Crear ProjectHospital
      const projectHospital = await prisma.projectHospital.create({
        data: {
          project_id: defaultProject.id,
          hospital_id: hospital.id,
          required_periods: 2, // Valor por defecto
          status: 'active'
        }
      });

      // Migrar HospitalProgress a ProjectHospitalProgress si existe
      if (hospital.progress) {
        console.log(`    - Migrando progreso del hospital`);
        await prisma.projectHospitalProgress.create({
          data: {
            project_hospital_id: projectHospital.id,
            descriptive_form_status: hospital.progress.descriptive_form_status,
            ethics_submitted: hospital.progress.ethics_submitted,
            ethics_approved: hospital.progress.ethics_approved,
            ethics_submitted_date: hospital.progress.ethics_submitted_date,
            ethics_approved_date: hospital.progress.ethics_approved_date,
            updated_at: hospital.progress.updated_at
          }
        });
      }

      // Migrar RecruitmentPeriods a ProjectRecruitmentPeriods
      if (hospital.recruitment_periods && hospital.recruitment_periods.length > 0) {
        console.log(`    - Migrando ${hospital.recruitment_periods.length} períodos de reclutamiento`);
        for (const period of hospital.recruitment_periods) {
          await prisma.projectRecruitmentPeriod.create({
            data: {
              project_hospital_id: projectHospital.id,
              period_number: period.period_number,
              start_date: period.start_date,
              end_date: period.end_date,
              status: period.status,
              created_at: period.created_at || new Date(),
              updated_at: period.updated_at || new Date()
            }
          });
        }
      }

      // Migrar coordinadores a ProjectCoordinator
      if (hospital.users && hospital.users.length > 0) {
        console.log(`    - Migrando ${hospital.users.length} coordinadores`);
        for (const user of hospital.users) {
          await prisma.projectCoordinator.create({
            data: {
              project_id: defaultProject.id,
              user_id: user.id,
              hospital_id: hospital.id,
              role: 'coordinator',
              invited_at: user.created_at,
              accepted_at: user.created_at, // Asumir que ya estaban activos
              is_active: user.isActive
            }
          });
        }
      }
    }

    // 4. Verificar migración
    console.log('🔍 Verificando migración...');
    const projectHospitalsCount = await prisma.projectHospital.count({
      where: { project_id: defaultProject.id }
    });
    const projectCoordinatorsCount = await prisma.projectCoordinator.count({
      where: { project_id: defaultProject.id }
    });
    const projectProgressCount = await prisma.projectHospitalProgress.count();
    const projectPeriodsCount = await prisma.projectRecruitmentPeriod.count();

    console.log('📈 Resumen de migración:');
    console.log(`  - ProjectHospitals: ${projectHospitalsCount}`);
    console.log(`  - ProjectCoordinators: ${projectCoordinatorsCount}`);
    console.log(`  - ProjectHospitalProgress: ${projectProgressCount}`);
    console.log(`  - ProjectRecruitmentPeriods: ${projectPeriodsCount}`);

    console.log('✅ Migración completada exitosamente!');
    console.log(`🎯 Proyecto por defecto ID: ${defaultProject.id}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateToMultiProject()
  .then(() => {
    console.log('🎉 Migración finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

