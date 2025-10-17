'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { CoordinatorSidebar } from './coordinator-sidebar';
import { CoordinatorHeader } from './coordinator-header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);

  // Si estamos en una página de auth, no mostrar el layout principal
  if (pathname.includes('/auth/')) {
    return <>{children}</>;
  }

  // Si no hay usuario autenticado, no mostrar el layout principal
  if (!user && !isLoading) {
    return <>{children}</>;
  }

  // Determinar qué sidebar y header usar según el rol
  const isCoordinator = user?.role === 'coordinator';
  const SidebarComponent = isCoordinator ? CoordinatorSidebar : Sidebar;
  const HeaderComponent = isCoordinator ? CoordinatorHeader : Header;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar dinámico según el rol */}
      <SidebarComponent />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderComponent userId={userId} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
