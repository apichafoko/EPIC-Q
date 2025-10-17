import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: userId } = await params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          hospital: true,
          project_coordinators: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  status: true
                }
              },
              hospital: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    try {
      const { id: userId } = await params;

      // Verificar que el usuario existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // No permitir que un admin se desactive a sí mismo
      if (userId === context.user.id) {
        return NextResponse.json(
          { error: 'No puedes desactivar tu propia cuenta' },
          { status: 400 }
        );
      }

      // Desactivar usuario (no eliminar)
      const deactivatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updated_at: new Date()
        }
      });

      console.log(`Usuario ${deactivatedUser.email} desactivado por admin ${context.user.email}`);

      return NextResponse.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
        user: {
          id: deactivatedUser.id,
          email: deactivatedUser.email,
          name: deactivatedUser.name,
          role: deactivatedUser.role,
          isActive: deactivatedUser.isActive
        }
      });

    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  })(request, { params });
}