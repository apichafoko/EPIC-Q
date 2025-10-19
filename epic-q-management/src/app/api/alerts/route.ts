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

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const hospital_id = searchParams.get('hospital_id') || 'all';

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { hospitals: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        where.is_resolved = false;
      } else if (status === 'resolved') {
        where.is_resolved = true;
      }
    }

    if (hospital_id && hospital_id !== 'all') {
      where.hospital_id = hospital_id;
    }

    // Obtener alertas
    const total = await prisma.alerts.count({ where });
    const alerts = await prisma.alerts.findMany({
      where,
      include: {
        hospitals: {
          select: { name: true, city: true, province: true }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
    });

    // Formatear alertas
    const formattedAlerts = alerts.map((a) => ({
      id: a.id,
      hospital_id: a.hospital_id,
      hospital_name: a.hospitals?.name || 'Hospital no encontrado',
      title: a.title,
      message: a.message,
      type: a.type,
      is_resolved: a.is_resolved,
      created_at: a.created_at,
      resolved_at: a.resolved_at,
      resolved_by: a.resolved_by,
      metadata: a.metadata || {},
    }));

    return NextResponse.json({
      alerts: formattedAlerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
