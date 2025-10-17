'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/useTranslations';
import {
  BarChart3,
  Building2,
  Mail,
  FileText,
  TrendingUp,
  AlertTriangle,
  Settings,
  Users
} from 'lucide-react';

export function Sidebar() {
  const { t, locale } = useTranslations();
  const pathname = usePathname();

  const navigation = [
    { name: t('common.dashboard'), href: `/${locale}`, icon: BarChart3 },
    { name: t('common.hospitals'), href: `/${locale}/hospitals`, icon: Building2 },
    { name: t('common.users'), href: `/${locale}/admin/users`, icon: Users },
    { name: t('common.communications'), href: `/${locale}/communications`, icon: Mail },
    { name: t('common.templates'), href: `/${locale}/communications/templates`, icon: FileText },
    { name: t('common.reports'), href: `/${locale}/reports`, icon: TrendingUp },
    { name: t('common.alerts'), href: `/${locale}/alerts`, icon: AlertTriangle },
    { name: t('common.settings'), href: `/${locale}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">EQ</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">EPIC-Q</h1>
            <p className="text-xs text-gray-500">Sistema de Gestión</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Admin EPIC-Q
            </p>
            <p className="text-xs text-gray-500 truncate">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
