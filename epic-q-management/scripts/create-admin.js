const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@epic-q.com',
        name: 'Administrador EPIC-Q',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: new Date(),
        preferredLanguage: 'es'
      }
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('Email: admin@epic-q.com');
    console.log('Password: admin123');
    console.log('ID:', admin.id);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  El usuario administrador ya existe');
    } else {
      console.error('❌ Error creando usuario administrador:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
