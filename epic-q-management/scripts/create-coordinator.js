const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCoordinator() {
  try {
    // Primero crear un hospital de prueba
    const hospital = await prisma.hospital.create({
      data: {
        redcap_id: 'HOSP001',
        name: 'Hospital General de Agudos Dr. Juan A. Fernández',
        province: 'CABA',
        city: 'Buenos Aires',
        status: 'active',
        participated_lasos: true
      }
    });

    console.log('✅ Hospital creado:', hospital.name);

    // Crear usuario coordinador
    const hashedPassword = await bcrypt.hash('coord123', 12);
    
    const coordinator = await prisma.user.create({
      data: {
        email: 'coord@hospital.com',
        name: 'Dr. María González',
        password: hashedPassword,
        role: 'coordinator',
        hospital_id: hospital.id,
        isActive: true,
        emailVerified: new Date(),
        preferredLanguage: 'es'
      }
    });

    console.log('✅ Usuario coordinador creado exitosamente:');
    console.log('Email: coord@hospital.com');
    console.log('Password: coord123');
    console.log('Hospital:', hospital.name);
    console.log('ID:', coordinator.id);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  El usuario coordinador ya existe');
    } else {
      console.error('❌ Error creando usuario coordinador:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createCoordinator();
