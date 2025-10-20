import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { User, LoginCredentials, LoginResponse } from './types';
import { prisma } from '@/lib/database';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

export class SimpleAuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      // Buscar usuario en la base de datos
      const user = await prisma.users.findUnique({
        where: { email },
        include: { 
          hospitals: true
        }
      });

      if (!user || !user.isActive || !user.password) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar contraseña hasheada
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Crear token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Formatear usuario para respuesta
      const userResponse: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        hospital: user.hospitals ? {
          id: user.hospitals.id,
          name: user.hospitals.name
        } : null,
        preferredLanguage: user.preferredLanguage,
        isActive: user.isActive,
        isTemporaryPassword: user.isTemporaryPassword,
        lastLogin: user.lastLogin
      };

      return {
        success: true,
        user: userResponse,
        token
      };
    } catch (error) {
      console.error('Auth service error:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const user = await prisma.users.findUnique({
        where: { id: decoded.userId },
        include: { 
          hospitals: true
        }
      });

      if (!user || !user.isActive) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hospitalId: user.hospitalId,
        hospital: user.hospitals ? {
          id: user.hospitals.id,
          name: user.hospitals.name
        } : null,
        preferredLanguage: user.preferredLanguage,
        isActive: user.isActive,
        isTemporaryPassword: user.isTemporaryPassword,
        lastLogin: user.lastLogin
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  static async verifyTokenFromRequest(request: Request | NextRequest): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const token = request.headers.get('auth-token') || 
                   request.headers.get('cookie')?.split(';')
                     .find(c => c.trim().startsWith('auth-token='))
                     ?.split('=')[1];

      if (!token) {
        return {
          success: false,
          error: 'Token no encontrado'
        };
      }

      const user = await this.verifyToken(token);
      
      if (!user) {
        return {
          success: false,
          error: 'Token inválido o usuario inactivo'
        };
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Error al verificar el token'
      };
    }
  }

  static async logout(): Promise<void> {
    // En un sistema JWT, el logout se maneja en el cliente
    // eliminando el token del localStorage
  }
}
