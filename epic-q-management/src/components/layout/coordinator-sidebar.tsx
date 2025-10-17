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
  Calendar,
  Users,
  Settings,
  Bell
} from 'lucide-react';

export function CoordinatorSidebar() {
  const { t, locale } = useTranslations();
  const pathname = usePathname();

  const navigation = [
    { 
      name: t('common.dashboard'), 
      href: `/${locale}/coordinator`, 
      icon: BarChart3 
    },
    { 
      name: t('common.hospitalForm'), 
      href: `/${locale}/coordinator/hospital-form`, 
      icon: Building2 
    },
    { 
      name: t('common.progress'), 
      href: `/${locale}/coordinator/progress`, 
      icon: Calendar 
    },
    { 
      name: t('common.communications'), 
      href: `/${locale}/coordinator/communications`, 
      icon: Mail 
    },
    { 
      name: t('common.notifications'), 
      href: `/${locale}/coordinator/notifications`, 
      icon: Bell 
    },
    { 
      name: t('common.redcapUsers'), 
      href: `/${locale}/coordinator/redcap-users`, 
      icon: Users 
    },
    { 
      name: t('common.settings'), 
      href: `/${locale}/coordinator/settings`, 
      icon: Settings 
    },
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
            <p className="text-xs text-gray-500">Coordinador</p>
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
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                isActive
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
