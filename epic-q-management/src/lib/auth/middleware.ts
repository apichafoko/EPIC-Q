import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from './simple-auth-service';
import { users } from '@prisma/client';

type UserRole = users['role'];

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    hospital_id?: string;
  };
}

export function withAuth(
  handler: (request: NextRequest, context: AuthContext, params?: { params: Promise<{ id: string }> }) => Promise<NextResponse> | NextResponse,
  options?: {
    roles?: UserRole[];
    requireHospital?: boolean;
  }
) {
  return async (request: NextRequest, params?: { params: Promise<{ id: string }> }) => {
    try {
      console.log('🔐 withAuth: Iniciando autenticación');
      const token = request.cookies.get('auth-token')?.value;
      console.log('🔐 withAuth: Token encontrado:', !!token);
      
      if (!token) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const user = await SimpleAuthService.verifyToken(token);
      console.log('🔐 withAuth: Usuario verificado:', user ? { id: user.id, email: user.email, role: user.role } : 'No encontrado');
      
      if (!user) {
        console.log('🔐 withAuth: Usuario no autorizado');
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (options?.roles && !options.roles.includes(user.role as UserRole)) {
        console.log('🔐 withAuth: Permisos insuficientes. Rol requerido:', options.roles, 'Rol actual:', user.role);
        return NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }

      // Check hospital requirement for coordinators
      if (options?.requireHospital && user.role === 'coordinator' && !user.hospital?.id) {
        return NextResponse.json(
          { error: 'Hospital no asignado' },
          { status: 403 }
        );
      }

      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role as UserRole,
          hospital_id: user.hospital?.id,
        },
      };

      return await handler(request, context, params);
    } catch (error) {
      console.error('Auth middleware error:', error);
      console.error('Auth error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return NextResponse.json(
        { 
          error: 'Error de autenticación',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  };
}

export function withAdminAuth(
  handler: (request: NextRequest, context: AuthContext, params?: { params: Promise<{ id: string }> }) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, params?: { params: Promise<{ id: string }> }) => {
    return withAuth(handler, { roles: ['admin'] })(request, params);
  };
}

export function withCoordinatorAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse> | NextResponse
) {
  return withAuth(handler, { 
    roles: ['coordinator']
  });
}

export function withRoleAuth(
  roles: UserRole[],
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse> | NextResponse
) {
  return withAuth(handler, { roles });
}
