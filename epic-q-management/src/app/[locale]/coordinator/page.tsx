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
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { CoordinatorStats } from '@/lib/services/coordinator-service';

export default function CoordinatorDashboard() {
  const { t } = useTranslations();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CoordinatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user || user.role !== 'coordinator') return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/coordinator/stats');
        const result = await response.json();
        
        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error || 'Error al cargar estadísticas');
        }
      } catch (err) {
        console.error('Error loading coordinator stats:', err);
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  if (authLoading || loading) {
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
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

        {/* Hospital Form Status - CRITICAL SECTION */}
        {stats?.hospitalFormStatus && (
          <div className={`rounded-lg border-2 p-6 ${
            stats.hospitalFormStatus.isComplete 
              ? 'border-green-200 bg-green-50' 
              : stats.hospitalFormStatus.isUrgent 
                ? 'border-red-200 bg-red-50' 
                : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full ${
                  stats.hospitalFormStatus.isComplete 
                    ? 'bg-green-100 text-green-600' 
                    : stats.hospitalFormStatus.isUrgent 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {stats.hospitalFormStatus.isComplete ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : stats.hospitalFormStatus.isUrgent ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <Clock className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold ${
                    stats.hospitalFormStatus.isComplete 
                      ? 'text-green-800' 
                      : stats.hospitalFormStatus.isUrgent 
                        ? 'text-red-800' 
                        : 'text-yellow-800'
                  }`}>
                    {stats.hospitalFormStatus.isComplete 
                      ? '✅ Formulario del Hospital Completado' 
                      : stats.hospitalFormStatus.isUrgent 
                        ? '🚨 FORMULARIO DEL HOSPITAL INCOMPLETO - URGENTE' 
                        : '⚠️ Formulario del Hospital Pendiente'}
                  </h2>
                  <p className={`mt-2 ${
                    stats.hospitalFormStatus.isComplete 
                      ? 'text-green-700' 
                      : stats.hospitalFormStatus.isUrgent 
                        ? 'text-red-700' 
                        : 'text-yellow-700'
                  }`}>
                    {stats.hospitalFormStatus.isComplete 
                      ? '¡Excelente! Has completado toda la información requerida del hospital.'
                      : stats.hospitalFormStatus.isUrgent 
                        ? 'El formulario del hospital lleva más de 7 días sin completarse. Es CRÍTICO que lo completes inmediatamente.'
                        : 'Completa la información del hospital para continuar con el proceso.'}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span>Progreso del Formulario</span>
                      <span>{stats.hospitalFormStatus.completedSteps}/{stats.hospitalFormStatus.totalSteps} campos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          stats.hospitalFormStatus.isComplete 
                            ? 'bg-green-500' 
                            : stats.hospitalFormStatus.isUrgent 
                              ? 'bg-red-500' 
                              : 'bg-yellow-500'
                        }`}
                        style={{ width: `${(stats.hospitalFormStatus.completedSteps / stats.hospitalFormStatus.totalSteps) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Missing Fields */}
                  {!stats.hospitalFormStatus.isComplete && stats.hospitalFormStatus.missingFields.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Campos pendientes:</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.hospitalFormStatus.missingFields.map((field, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Button */}
              <div className="ml-4">
                <Button 
                  size="lg" 
                  className={`${
                    stats.hospitalFormStatus.isComplete 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : stats.hospitalFormStatus.isUrgent 
                        ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                        : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white font-bold px-6 py-3`}
                  onClick={() => router.push(`/${user?.preferredLanguage || 'es'}/coordinator/hospital-form`)}
                >
                  {stats.hospitalFormStatus.isComplete 
                    ? 'Ver Formulario' 
                    : 'Completar Formulario'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`${
            stats?.hospitalFormStatus?.isUrgent 
              ? 'border-red-200 bg-red-50' 
              : stats?.hospitalFormStatus?.isComplete 
                ? 'border-green-200 bg-green-50' 
                : 'border-yellow-200 bg-yellow-50'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${
                stats?.hospitalFormStatus?.isUrgent 
                  ? 'text-red-800' 
                  : stats?.hospitalFormStatus?.isComplete 
                    ? 'text-green-800' 
                    : 'text-yellow-800'
              }`}>
                {t('coordinator.dashboard.formCompletion')}
              </CardTitle>
              {stats?.hospitalFormStatus?.isUrgent ? (
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              ) : stats?.hospitalFormStatus?.isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stats?.hospitalFormStatus?.isUrgent 
                  ? 'text-red-600' 
                  : stats?.hospitalFormStatus?.isComplete 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
              }`}>
                {stats?.formCompletion || 0}%
              </div>
              <p className={`text-xs ${
                stats?.hospitalFormStatus?.isUrgent 
                  ? 'text-red-600' 
                  : stats?.hospitalFormStatus?.isComplete 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
              }`}>
                {stats?.hospitalFormStatus?.isComplete 
                  ? 'Formulario completado' 
                  : stats?.hospitalFormStatus?.isUrgent 
                    ? '¡URGENTE! Completa el formulario' 
                    : 'Formulario pendiente'}
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
              <div className="text-2xl font-bold">{stats?.upcomingPeriods || 0}</div>
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
              <div className="text-2xl font-bold">{stats?.notifications || 0}</div>
              <p className="text-xs text-gray-500">
                {t('coordinator.dashboard.notificationsDesc')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Configuración</span>
              </CardTitle>
              <CardDescription>
                Gestiona las configuraciones del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ir a Configuración
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
              {stats?.hospitalFormStatus?.isUrgent && (
                <Badge variant="destructive" className="ml-2 animate-pulse">
                  URGENTE
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Urgent Hospital Form Notification */}
            {stats?.hospitalFormStatus && !stats.hospitalFormStatus.isComplete && (
              <div className={`flex items-start space-x-3 p-3 rounded-lg ${
                stats.hospitalFormStatus.isUrgent 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  stats.hospitalFormStatus.isUrgent 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className={`text-sm font-medium ${
                    stats.hospitalFormStatus.isUrgent 
                      ? 'text-red-800' 
                      : 'text-yellow-800'
                  }`}>
                    {stats.hospitalFormStatus.isUrgent 
                      ? '🚨 FORMULARIO DEL HOSPITAL INCOMPLETO - URGENTE' 
                      : '⚠️ Formulario del Hospital Pendiente'}
                  </p>
                  <p className={`text-xs ${
                    stats.hospitalFormStatus.isUrgent 
                      ? 'text-red-600' 
                      : 'text-yellow-600'
                  }`}>
                    {stats.hospitalFormStatus.isUrgent 
                      ? 'Lleva más de 7 días sin completarse. Es CRÍTICO que lo completes inmediatamente.' 
                      : 'Completa la información del hospital para continuar con el proceso.'}
                  </p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {stats.hospitalFormStatus.completedSteps}/{stats.hospitalFormStatus.totalSteps} campos completados
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {stats?.recentNotifications && stats.recentNotifications.length > 0 ? (
              stats.recentNotifications.map((notification) => {
                const getNotificationColor = (type: string) => {
                  switch (type) {
                    case 'urgent': return 'bg-red-50';
                    case 'warning': return 'bg-yellow-50';
                    case 'info': return 'bg-blue-50';
                    default: return 'bg-gray-50';
                  }
                };
                
                const getDotColor = (type: string) => {
                  switch (type) {
                    case 'urgent': return 'bg-red-500';
                    case 'warning': return 'bg-yellow-500';
                    case 'info': return 'bg-blue-500';
                    default: return 'bg-gray-400';
                  }
                };

                const formatTimeAgo = (date: Date | string) => {
                  const now = new Date();
                  const dateObj = typeof date === 'string' ? new Date(date) : date;
                  
                  // Verificar si la fecha es válida
                  if (isNaN(dateObj.getTime())) {
                    return 'Fecha inválida';
                  }
                  
                  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
                  
                  if (diffInHours < 1) return 'Hace menos de 1 hora';
                  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
                  
                  const diffInDays = Math.floor(diffInHours / 24);
                  return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
                };

                return (
                  <div key={notification.id} className={`flex items-start space-x-3 p-3 ${getNotificationColor(notification.type)} rounded-lg`}>
                    <div className={`w-2 h-2 ${getDotColor(notification.type)} rounded-full mt-2`}></div>
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay notificaciones recientes</p>
              </div>
            )}
          </div>
        </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}