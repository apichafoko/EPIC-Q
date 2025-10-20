'use client';

import { useAuth } from '@/contexts/auth-context';
import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleLanguageSelector } from '@/components/simple-language-selector';
import { ProjectSelector } from '@/components/layout/project-selector';
import { useTranslations } from '@/hooks/useTranslations';
import { Logo } from '@/components/ui/logo';
import { PWAInstallButton } from '@/components/pwa/pwa-install-button';

export function CoordinatorHeader() {
  const { user, logout, isLoading } = useAuth();
  const { t, locale } = useTranslations();

  const handleSignOut = () => {
    logout();
  };

  // Mostrar loading si aún se está verificando la autenticación
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Logo size="sm" showText={false} />
            <span>/</span>
            <span className="text-gray-900">{t('common.dashboard')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Logo size="sm" showText={false} />
          <span>/</span>
          <span className="text-gray-900">{t('common.dashboard')}</span>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Project Selector */}
          <ProjectSelector />

          {/* PWA Install Button */}
          <PWAInstallButton userRole="coordinator" />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('common.notifications')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-gray-500">No hay notificaciones</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Selector */}
          <SimpleLanguageSelector />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="hidden sm:block">
                  {user && user.name ? user.name : 'Coordinador'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={`/${locale}/profile`}>{t('common.profile')}</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`/${locale}/settings`}>{t('common.settings')}</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                {t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
