'use client';

import { useAuth } from '../../contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    // Si no requiere autenticación (como login), mostrar contenido
    if (!requireAuth) {
      setIsChecking(false);
      return;
    }

    // Si requiere autenticación pero no hay usuario, redirigir al login
    if (!user) {
      const locale = pathname.split('/')[1];
      router.push(`/${locale}/auth/login`);
      return;
    }

    // Si hay roles específicos y el usuario no tiene el rol correcto
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      const locale = pathname.split('/')[1];
      // Redirigir según el rol del usuario
      if (user.role === 'admin') {
        router.push(`/${locale}/admin`);
      } else if (user.role === 'coordinator') {
        router.push(`/${locale}/coordinator`);
      }
      return;
    }

    setIsChecking(false);
  }, [user, isLoading, requireAuth, allowedRoles, router, pathname]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no requiere autenticación o el usuario está autenticado correctamente
  return <>{children}</>;
}
