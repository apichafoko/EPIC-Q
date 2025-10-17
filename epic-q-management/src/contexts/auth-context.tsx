'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, LoginCredentials } from '@/lib/auth/types';
import { ChangePasswordModal } from '@/components/auth/change-password-modal';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showChangePasswordModal: boolean;
  handlePasswordChangeSuccess: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [hasShownPasswordModal, setHasShownPasswordModal] = useState(false);

  const isAuthenticated = !!user;

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkPendingInvitations = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/coordinator/invitations/pending?userId=${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success && data.invitations && data.invitations.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking pending invitations:', error);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Auth response data:', data);
        if (data.success) {
          setUser(data.user);
          // Mostrar modal de cambio de contraseña si es temporal y no se ha mostrado antes
          if (data.user.isTemporaryPassword && !hasShownPasswordModal) {
            setShowChangePasswordModal(true);
            setHasShownPasswordModal(true);
          }
        }
      } else {
        // 401 es esperado cuando no hay usuario autenticado
        if (response.status !== 401) {
          console.log('Auth failed, status:', response.status);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        
        // Verificar si el usuario tiene invitaciones pendientes
        if (data.user.role === 'coordinator') {
          const hasPendingInvitations = await checkPendingInvitations(data.user.id);
          if (hasPendingInvitations) {
            window.location.href = '/es/coordinator/pending-invitations';
            return true;
          }
        }
        
        // Redirigir según el rol después del login exitoso
        if (data.user.role === 'admin') {
          window.location.href = '/es/admin';
        } else if (data.user.role === 'coordinator') {
          window.location.href = '/es/coordinator';
        }
        
        return true;
      } else {
        console.error('Login error:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setHasShownPasswordModal(false); // Resetear el flag al hacer logout
    }
  };

  const refreshUser = async (): Promise<void> => {
    await checkAuth();
  };

  const handlePasswordChangeSuccess = async () => {
    setShowChangePasswordModal(false);
    setHasShownPasswordModal(false); // Resetear el flag para futuras sesiones
    // Refrescar el usuario para obtener los datos actualizados
    await refreshUser();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    showChangePasswordModal,
    handlePasswordChangeSuccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal} 
        onSuccess={handlePasswordChangeSuccess}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
