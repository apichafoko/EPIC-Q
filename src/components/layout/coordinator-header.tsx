'use client';

import { useAuth } from '../../contexts/auth-context';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { SimpleLanguageSelector } from '../../components/simple-language-selector';
import { ProjectSelector } from '../../components/layout/project-selector';
import { useTranslations } from '../../hooks/useTranslations';
import { Logo } from '../../components/ui/logo';
import { PWAInstallButton } from '../../components/pwa/pwa-install-button';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

interface CoordinatorHeaderProps {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function CoordinatorHeader({ isMobile = false, onMenuClick }: CoordinatorHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const { t, locale } = useTranslations();
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const resp = await fetch('/api/notifications?limit=5', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data.notifications || []);
        setNotifCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:update', handler);
    return () => window.removeEventListener('notifications:update', handler);
  }, []);

  const handleNotificationClick = async (n: any) => {
    try {
      if (n.source === 'communication') {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationId: n.id, type: 'communication' })
        });
      } else if (n.source === 'system') {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationId: n.id, type: 'notification' })
        });
      }
    } catch (e) {
      console.error('Error marking notif as read:', e);
    } finally {
      // Optimistic update
      setNotifications(prev => prev.filter(x => x.id !== n.id));
      setNotifCount(prev => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notifications:update'));
      window.location.href = `/${locale}/coordinator/inbox`;
    }
  };

  const handleSignOut = () => {
    logout();
  };

  // Mostrar loading si aún se está verificando la autenticación
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center space-x-3">
            {isMobile && (
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            )}
            <Logo size="sm" showText={false} />
            <span className="hidden md:inline text-sm text-gray-500">/ {t('common.dashboard')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile: Hamburger + Logo */}
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg touch-target"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <Logo size="sm" showText={false} />
          <span className="hidden md:inline text-sm text-gray-500">/ {t('common.dashboard')}</span>
        </div>

        {/* Actions - Compactas en móvil */}
        <div className="flex items-center space-x-2">
          {/* Ocultar ProjectSelector en móvil muy pequeño */}
          <div className="hidden sm:block">
            <ProjectSelector />
          </div>
          
          {/* PWA Button - solo ícono en móvil */}
          <PWAInstallButton userRole="coordinator" />
          
          {/* Notificaciones - solo ícono */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative touch-target">
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-medium leading-none text-white bg-red-600 rounded-full">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('common.notifications')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <DropdownMenuItem>
                  <span className="text-gray-500">No hay notificaciones</span>
                </DropdownMenuItem>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start space-y-0.5" onClick={() => handleNotificationClick(n)}>
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-gray-500 truncate w-full">{n.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Language selector - oculto en móvil pequeño */}
          <div className="hidden md:block">
            <SimpleLanguageSelector />
          </div>
          
          {/* User menu - siempre visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 touch-target">
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
