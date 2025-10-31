'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, ReportFiltersProps } from './report-filters';
import { TrendingUp, Download } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { toast } from 'sonner';

interface VelocityData {
  date: string;
  casesCreated: number;
  cumulativeCases: number;
  velocity: number;
}

interface RecruitmentVelocityReportProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
}

export function RecruitmentVelocityReport({
  projects,
  hospitals,
  provinces,
}: RecruitmentVelocityReportProps) {
  const [data, setData] = useState<VelocityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({ granularity: 'day' });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric', 'recruitment_velocity');
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.province) params.append('province', filters.province);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.granularity) params.append('granularity', filters.granularity);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Error al cargar datos del reporte');
      }
    } catch (error) {
      console.error('Error loading recruitment velocity:', error);
      toast.error('Error al cargar datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters: ReportFilters) => {
    setFilters((prevFilters) => {
      // Solo actualizar si realmente hay cambios
      const hasChanges =
        prevFilters.projectId !== newFilters.projectId ||
        prevFilters.hospitalId !== newFilters.hospitalId ||
        prevFilters.province !== newFilters.province ||
        prevFilters.dateFrom !== newFilters.dateFrom ||
        prevFilters.dateTo !== newFilters.dateTo ||
        prevFilters.granularity !== newFilters.granularity ||
        prevFilters.level !== newFilters.level;
      
      if (!hasChanges) {
        return prevFilters;
      }
      
      return newFilters;
    });
  }, []);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'recruitment_velocity',
          format,
          filters,
        }),
      });

      const result = await response.json();
      if (result.success && result.data.content) {
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.data.filename || 'recruitment-velocity.csv';
        link.click();
        toast.success('Reporte exportado exitosamente');
      } else {
        toast.error('Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar reporte');
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const avgVelocity = data.length > 0
    ? data.reduce((sum, d) => sum + d.velocity, 0) / data.length
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>Análisis de Velocidad de Reclutamiento</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Evaluación de la velocidad de reclutamiento de casos a lo largo del tiempo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <ReportFilters
        projects={projects}
        hospitals={hospitals}
        provinces={provinces}
        onFiltersChange={handleFiltersChange}
        showGranularity={true}
      />

      {/* Métricas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Velocidad Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgVelocity.toFixed(2)} casos/día
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Casos Acumulados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0 ? data[data.length - 1].cumulativeCases : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Períodos Analizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Velocidad y Casos */}
      <Card>
        <CardHeader>
          <CardTitle>Velocidad de Reclutamiento</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
                  formatter={(value: number, name: string) => {
                    if (name === 'casesCreated') return [value, 'Casos Creados'];
                    if (name === 'cumulativeCases') return [value, 'Casos Acumulados'];
                    if (name === 'velocity') return [`${value.toFixed(2)}`, 'Velocidad (casos/día)'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="casesCreated" fill="#3b82f6" name="Casos Creados" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativeCases"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Casos Acumulados"
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="velocity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Velocidad (casos/día)"
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos disponibles para los filtros seleccionados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

