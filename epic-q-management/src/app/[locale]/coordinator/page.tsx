'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FileText, 
  Calendar, 
  Users, 
  Bell,
  Loader2
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const { t } = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'coordinator') {
    router.push('/es/auth/login');
    return null;
  }

  return (
    <AuthGuard allowedRoles={['coordinator']}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('coordinator.dashboard.welcome')}, {user.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('coordinator.dashboard.subtitle')}
        </p>
        {user.hospital && (
          <div className="mt-2">
            <Badge variant="outline" className="text-sm">
              <Building2 className="h-3 w-3 mr-1" />
              {user.hospital.name}
            </Badge>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('coordinator.dashboard.formCompletion')}
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-gray-500">
              {t('coordinator.dashboard.formCompletionDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('coordinator.dashboard.upcomingPeriods')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-gray-500">
              {t('coordinator.dashboard.upcomingPeriodsDesc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('coordinator.dashboard.notifications')}
            </CardTitle>
            <Bell className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-gray-500">
              {t('coordinator.dashboard.notificationsDesc')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{t('coordinator.dashboard.completeForm')}</span>
            </CardTitle>
            <CardDescription>
              {t('coordinator.dashboard.completeFormDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              {t('coordinator.dashboard.startForm')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('coordinator.dashboard.setDates')}</span>
            </CardTitle>
            <CardDescription>
              {t('coordinator.dashboard.setDatesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              {t('coordinator.dashboard.manageDates')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>{t('coordinator.dashboard.recentNotifications')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Nueva comunicación del comité</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Período de reclutamiento próximo</p>
                <p className="text-xs text-gray-500">Hace 1 día</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Formulario completado</p>
                <p className="text-xs text-gray-500">Hace 3 días</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}