'use client';

import { useState } from 'react';
import { Bell, User, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { SimpleLanguageSelector } from '../../components/simple-language-selector';
import { NotificationBell } from '../../components/notifications/notification-bell';
import { ThemeSelector } from '../../components/ui/theme-selector';
import { useTranslations } from '../../hooks/useTranslations';
import { Logo } from '../../components/ui/logo';
import { useAuth } from '../../contexts/auth-context';
import { mockAlerts } from '../../lib/mock-data';
import { PWAInstallButton } from '../../components/pwa/pwa-install-button';
import { GlobalSearch } from '../../components/ui/global-search';

interface HeaderProps {
  userId?: string;
}

export function Header({ userId }: HeaderProps) {
  const { t, locale } = useTranslations();
  const { logout } = useAuth();
  const activeAlerts = mockAlerts.filter(alert => !alert.is_resolved).length;
  const [showSearch, setShowSearch] = useState(false);

  const handleSignOut = () => {
    logout();
  };

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Logo size="sm" showText={false} />
              <span>/</span>
              <span className="text-gray-900">{t('common.dashboard')}</span>
            </div>

        {/* Global Search - Visible en desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <GlobalSearch 
            placeholder={t('common.search') || 'Buscar hospitales, proyectos, usuarios...'} 
            className="w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 text-foreground">
          {/* Botón de búsqueda en móvil */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* PWA Install Button (Admin - only mobile) */}
          <PWAInstallButton userRole="admin" />

          {/* Notifications */}
          {userId ? (
            <NotificationBell userId={userId} />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {activeAlerts > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {activeAlerts}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('common.notifications')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activeAlerts > 0 ? (
                  <>
                    {mockAlerts
                      .filter(alert => !alert.is_resolved)
                      .slice(0, 5)
                      .map((alert) => (
                        <DropdownMenuItem key={alert.id} className="flex flex-col items-start">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-500' :
                              alert.severity === 'high' ? 'bg-orange-500' :
                              alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <span className="font-medium">{alert.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                        </DropdownMenuItem>
                      ))}
                  </>
                ) : (
                  <DropdownMenuItem disabled>
                    {t('common.noNotifications')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Language Selector */}
          <SimpleLanguageSelector />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="hidden sm:block">Admin EPIC-Q</span>
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    {t('common.logout')}
                  </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  {/* Search overlay en móvil */}
  {showSearch && (
    <div className="md:hidden mt-2 px-6 pb-2">
      <GlobalSearch 
        placeholder={t('common.search') || 'Buscar hospitales, proyectos, usuarios...'} 
        className="w-full"
        onResultClick={() => setShowSearch(false)}
      />
    </div>
  )}
</header>
  );
}
