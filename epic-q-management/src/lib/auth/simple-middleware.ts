import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from './simple-auth-service';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    hospital_id?: string;
  };
}

export function withAdminAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    try {
      const token = request.cookies.get('auth-token')?.value;
      
      if (!token) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      const user = await SimpleAuthService.verifyToken(token);
      
      if (!user) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        );
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Permisos insuficientes' },
          { status: 403 }
        );
      }

      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || '',
          role: user.role,
          hospital_id: user.hospital?.id,
        },
      };

      return await handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Error de autenticación' },
        { status: 500 }
      );
    }
  };
}
