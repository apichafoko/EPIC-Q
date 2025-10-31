'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';
import { useTranslations } from '../../hooks/useTranslations';
import { Logo } from '../../components/ui/logo';
import {
  BarChart3,
  Building2,
  Mail,
  FileText,
  TrendingUp,
  AlertTriangle,
  Settings,
  Users,
  Bug,
  FolderOpen,
  Sliders,
  BookOpen,
  Shield,
  Activity,
  Calendar
} from 'lucide-react';

export function Sidebar() {
  const { t, locale } = useTranslations();
  const pathname = usePathname();

  const navigation = [
    { name: t('common.dashboard'), href: `/${locale}`, icon: BarChart3 },
    { name: t('common.projects'), href: `/${locale}/admin/projects`, icon: FolderOpen },
    { name: t('common.hospitals'), href: `/${locale}/hospitals`, icon: Building2 },
    { name: t('common.users'), href: `/${locale}/admin/users`, icon: Users },
    { name: 'Centro de Documentación', href: `/${locale}/resources`, icon: BookOpen },
    { name: t('common.communications'), href: `/${locale}/communications`, icon: Mail },
    { name: t('common.templates'), href: `/${locale}/templates`, icon: FileText },
    { name: t('common.reports'), href: `/${locale}/reports`, icon: TrendingUp },
    { name: 'Analytics Avanzado', href: `/${locale}/admin/analytics`, icon: TrendingUp },
    { name: t('common.alerts'), href: `/${locale}/alerts`, icon: AlertTriangle },
    { name: 'Configuración de Alertas', href: `/${locale}/admin/alert-configurations`, icon: Sliders },
    { name: 'Auditoría', href: `/${locale}/admin/audit`, icon: Activity },
    { name: 'Logs de Seguridad', href: `/${locale}/admin/security/logs`, icon: Shield },
    { name: 'Debug Email', href: `/${locale}/admin/email-debug`, icon: Bug },
    { name: t('common.settings'), href: `/${locale}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r border-border text-foreground">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <Logo size="md" showText={false} />
          <div>
            <h1 className="text-lg font-semibold text-foreground">EPIC-Q</h1>
            <p className="text-xs text-muted-foreground">Sistema de Gestión</p>
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
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-700' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Admin EPIC-Q
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
