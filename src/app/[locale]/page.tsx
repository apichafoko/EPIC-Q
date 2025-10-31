'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { KPICard } from '../../components/dashboard/kpi-card';
import { HospitalsByStatusChart } from '../../components/dashboard/hospitals-by-status-chart';
import { StatusDistributionChart } from '../../components/dashboard/status-distribution-chart';
import { RecentAlerts } from '../../components/dashboard/recent-alerts';
import { UpcomingRecruitment } from '../../components/dashboard/upcoming-recruitment';
import { useTranslations } from '../../hooks/useTranslations';
import { DashboardKPIs } from '../../types';
import { 
  Building2, 
  Activity, 
  BarChart3, 
  AlertTriangle,
  Calendar,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  console.log('📊 Dashboard ejecutándose');
  // TODOS los hooks deben ejecutarse siempre en el mismo orden
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { t } = useTranslations();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirigir según el rol del usuario
  useEffect(() => {
    if (isLoading || hasRedirected || !user) return;
    
    const locale = pathname.split('/')[1];
    
    // Redirigir según el rol
    if (user.role === 'admin') {
      // Si ya está en admin, no redirigir
      if (!pathname.includes('/admin')) {
        setHasRedirected(true);
        router.replace(`/${locale}/admin`);
      }
    } else if (user.role === 'coordinator') {
      // Si ya está en coordinator, no redirigir
      if (!pathname.includes('/coordinator')) {
        setHasRedirected(true);
        router.replace(`/${locale}/coordinator`);
      }
    } else {
      // Otro rol o sin rol, ir a login
      setHasRedirected(true);
      router.replace(`/${locale}/auth/login`);
    }
  }, [user, isLoading, pathname, router, hasRedirected]);

  // Cargar KPIs - debe ejecutarse siempre
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setKpis(result.data.kpis);
          }
        }
      } catch (error) {
        console.error('Error loading dashboard KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
  }, []);

  // Render condicional - después de TODOS los hooks
  // Mostrar loading mientras se verifica autenticación o se redirige
  if (isLoading || hasRedirected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">
            {isLoading ? 'Verificando autenticación...' : 'Redirigiendo...'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Error al cargar los datos del dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title={t('dashboard.totalHospitals')}
          value={kpis.totalHospitals}
          subtitle={`${kpis.activeHospitals} ${t('dashboard.activeHospitals').toLowerCase()}`}
          icon={Building2}
          color="blue"
          trend={{
            value: kpis.trends.totalHospitals,
            label: t('dashboard.vsPreviousMonth')
          }}
        />
        <KPICard
          title={t('dashboard.totalCases')}
          value={kpis.totalCases.toLocaleString()}
          subtitle={t('dashboard.registeredInRedCap')}
          icon={BarChart3}
          color="green"
          trend={{
            value: kpis.trends.totalCases,
            label: t('dashboard.vsPreviousMonth')
          }}
        />
        <KPICard
          title={t('dashboard.averageCompletion')}
          value={`${kpis.averageCompletion}%`}
          subtitle={t('dashboard.target')}
          icon={Activity}
          color="yellow"
          trend={{
            value: kpis.trends.averageCompletion,
            label: t('dashboard.vsPreviousMonth')
          }}
        />
        <KPICard
          title={t('dashboard.activeAlerts')}
          value={kpis.activeAlerts}
          subtitle={t('dashboard.requireAttention')}
          icon={AlertTriangle}
          color="red"
          trend={{
            value: kpis.trends.activeAlerts,
            label: t('dashboard.vsPreviousMonth')
          }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HospitalsByStatusChart />
        <StatusDistributionChart />
      </div>

      {/* Alerts and Recruitment Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlerts />
        <UpcomingRecruitment />
      </div>
    </div>
  );
}
