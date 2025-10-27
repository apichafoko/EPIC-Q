const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    const admin = await prisma.users.create({
      data: {
        id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: 'demo@epic-q.com',
        name: 'Administrador EPIC-Q',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        emailVerified: new Date(),
        preferredLanguage: 'es',
        updated_at: new Date()
      }
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log('Email: demo@epic-q.com');
    console.log('Password: demo123');
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
