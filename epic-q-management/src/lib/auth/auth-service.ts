import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/database';
import { User, LoginCredentials, LoginResponse } from './types';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;

      // Buscar usuario en la base de datos
      const user = await prisma.users.findUnique({
        where: { email },
        include: {
          hospital: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!user || !user.password || !user.isActive) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Actualizar último login
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

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
        hospitalId: user.hospital_id,
        hospital: user.hospital,
        preferredLanguage: user.preferredLanguage,
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString() || null
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
          hospital: {
            select: {
              id: true,
              name: true
            }
          }
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
        hospitalId: user.hospital_id,
        hospital: user.hospital,
        preferredLanguage: user.preferredLanguage,
        isActive: user.isActive,
        lastLogin: user.lastLogin?.toISOString() || null
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    // En un sistema JWT, el logout se maneja en el cliente
    // eliminando el token del localStorage
  }
}
