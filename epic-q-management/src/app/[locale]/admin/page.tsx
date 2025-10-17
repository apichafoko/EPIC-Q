'use client';

import { useState, useEffect } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { HospitalsByStatusChart } from '@/components/dashboard/hospitals-by-status-chart';
import { StatusDistributionChart } from '@/components/dashboard/status-distribution-chart';
import { RecentAlerts } from '@/components/dashboard/recent-alerts';
import { UpcomingRecruitment } from '@/components/dashboard/upcoming-recruitment';
import { useTranslations } from '@/hooks/useTranslations';
import { AuthGuard } from '@/components/auth/auth-guard';
import { 
  Building2, 
  Activity, 
  BarChart3, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { DashboardKPIs } from '@/types';

export default function AdminDashboard() {
  const { t } = useTranslations();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.kpis) {
            setKpis(result.data.kpis);
          } else {
            console.error('Error loading KPIs: Invalid response format');
          }
        } else {
          console.error('Error loading KPIs:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-2">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* KPIs */}
      {kpis && (
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
      )}

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
    </AuthGuard>
  );
}
