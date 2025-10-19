import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Inicializar Prisma directamente
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación manualmente
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar que el usuario existe y es admin
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: { hospitals: true }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener estadísticas
    const [
      total,
      active,
      resolved,
      critical,
      high,
      medium,
      low
    ] = await Promise.all([
      prisma.alerts.count(),
      prisma.alerts.count({ where: { is_resolved: false } }),
      prisma.alerts.count({ where: { is_resolved: true } }),
      prisma.alerts.count({ where: { type: 'critical' } }),
      prisma.alerts.count({ where: { type: 'high' } }),
      prisma.alerts.count({ where: { type: 'medium' } }),
      prisma.alerts.count({ where: { type: 'low' } })
    ]);

    return NextResponse.json({
      total,
      active,
      resolved,
      critical,
      high,
      medium,
      low
    });

  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
