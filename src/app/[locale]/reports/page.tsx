'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/auth/auth-guard';
import { HospitalProgressReport } from '@/components/reports/hospital-progress-report';
import { RecruitmentVelocityReport } from '@/components/reports/recruitment-velocity-report';
import { ProvinceComparisonReport } from '@/components/reports/province-comparison-report';
import { CompletionPredictionReport } from '@/components/reports/completion-prediction-report';
import { CustomReportsBuilder } from '@/components/reports/custom-reports-builder';
import { BarChart3, TrendingUp, MapPin, Calendar, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Cargar proyectos - intentar admin primero, luego coordinator
      let projectsData;
      try {
        const projectsRes = await fetch('/api/admin/projects?status=all');
        projectsData = await projectsRes.json();
      } catch {
        // Si falla, intentar como coordinador
        const projectsRes = await fetch('/api/coordinator/projects');
        projectsData = await projectsRes.json();
        if (projectsData.success && projectsData.projects) {
          projectsData.projects = projectsData.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
          }));
        }
      }

      if (projectsData?.success && projectsData.projects) {
        setProjects(projectsData.projects.map((p: any) => ({ id: p.id, name: p.name })));
      }

      // Cargar hospitales - usar el endpoint de analytics para obtener provincias
      try {
        const hospitalsRes = await fetch('/api/hospitals?limit=1000');
        const hospitalsData = await hospitalsRes.json();
        if (hospitalsData.success && hospitalsData.hospitals) {
          setHospitals(hospitalsData.hospitals.map((h: any) => ({ id: h.id, name: h.name })));

          // Extraer provincias únicas
          const uniqueProvinces = Array.from(
            new Set(hospitalsData.hospitals.map((h: any) => h.province).filter(Boolean))
          ) as string[];
          setProvinces(uniqueProvinces);
        }
      } catch {
        // Si falla, obtener provincias del endpoint de analytics
        const analyticsRes = await fetch('/api/analytics?metric=geographic_distribution&distributionType=cases');
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success && analyticsData.data) {
          setProvinces(analyticsData.data.map((d: any) => d.province));
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['admin', 'coordinator']}>
        <div className="p-6 space-y-6">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['admin', 'coordinator']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground mt-2">
            Genera reportes detallados del progreso del estudio EPIC-Q
          </p>
        </div>

        {/* Tabs con Reportes */}
        <Tabs defaultValue="hospital-progress" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hospital-progress" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Avance por Hospital</span>
            </TabsTrigger>
            <TabsTrigger value="recruitment-velocity" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Velocidad de Reclutamiento</span>
            </TabsTrigger>
            <TabsTrigger value="province-comparison" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Comparativa por Provincias</span>
            </TabsTrigger>
            <TabsTrigger value="completion-prediction" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Predicción de Finalización</span>
            </TabsTrigger>
            <TabsTrigger value="custom-reports" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Reportes Personalizados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hospital-progress" className="space-y-6">
            <HospitalProgressReport
              projects={projects}
              hospitals={hospitals}
              provinces={provinces}
            />
          </TabsContent>

          <TabsContent value="recruitment-velocity" className="space-y-6">
            <RecruitmentVelocityReport
              projects={projects}
              hospitals={hospitals}
              provinces={provinces}
            />
          </TabsContent>

          <TabsContent value="province-comparison" className="space-y-6">
            <ProvinceComparisonReport
              projects={projects}
              hospitals={hospitals}
              provinces={provinces}
            />
          </TabsContent>

          <TabsContent value="completion-prediction" className="space-y-6">
            <CompletionPredictionReport
              projects={projects}
              hospitals={hospitals}
              provinces={provinces}
            />
          </TabsContent>

          <TabsContent value="custom-reports" className="space-y-6">
            <CustomReportsBuilder
              projects={projects}
              hospitals={hospitals}
              provinces={provinces}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
