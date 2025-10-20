'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CoordinatorSidebar } from './coordinator-sidebar';
import { CoordinatorHeader } from './coordinator-header';
import { Loader2 } from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { isMobile, sidebarOpen, setSidebarOpen } = useMobileDetection();

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  // Efecto para manejar la redirección al login
  useEffect(() => {
    if (!isLoading && !user && !pathname.includes('/auth/')) {
      const locale = pathname.split('/')[1] || 'es';
      setIsRedirecting(true);
      router.push(`/${locale}/auth/login`);
    }
  }, [user, isLoading, pathname, router]);

  // Si estamos en una página de auth, no mostrar el layout principal
  if (pathname.includes('/auth/')) {
    return <>{children}</>;
  }

  // Mostrar loading mientras se verifica la autenticación o se redirige
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {isLoading ? 'Verificando autenticación...' : 'Redirigiendo al login...'}
          </p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar loading (la redirección se maneja en useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Determinar qué sidebar y header usar según el rol
  const isCoordinator = user?.role === 'coordinator';
  const SidebarComponent = isCoordinator ? CoordinatorSidebar : Sidebar;
  const HeaderComponent = isCoordinator ? CoordinatorHeader : Header;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar con control móvil */}
      {isCoordinator ? (
        <CoordinatorSidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />
      ) : (
        <SidebarComponent />
      )}
      
      {/* Main content con margin responsive */}
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden",
        // Desktop: margin para sidebar fijo solo para coordinadores
        isCoordinator && !isMobile && "lg:ml-64"
      )}>
        {isCoordinator ? (
          <CoordinatorHeader 
            isMobile={isMobile}
            onMenuClick={() => setSidebarOpen(true)}
          />
        ) : (
          <HeaderComponent userId={userId} />
        )}
        <main className="flex-1 overflow-y-auto mobile-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
