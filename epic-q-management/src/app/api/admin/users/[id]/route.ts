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