'use client';

import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimpleLanguageSelector } from '@/components/simple-language-selector';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useTranslations } from '@/hooks/useTranslations';
import { mockAlerts } from '@/lib/mock-data';

interface HeaderProps {
  userId?: string;
}

export function Header({ userId }: HeaderProps) {
  const { t } = useTranslations();
  const activeAlerts = mockAlerts.filter(alert => !alert.is_resolved).length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>EPIC-Q</span>
              <span>/</span>
              <span className="text-gray-900">{t('common.dashboard')}</span>
            </div>

        {/* Search and Actions */}
        <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t('common.search')}
                  className="pl-10 w-80"
                />
              </div>

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
                  <DropdownMenuItem>{t('common.profile')}</DropdownMenuItem>
                  <DropdownMenuItem>{t('common.settings')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>{t('common.logout')}</DropdownMenuItem>
                </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
