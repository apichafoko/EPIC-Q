'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, ReportFiltersProps } from './report-filters';
import { Calendar, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

interface PredictionData {
  entityId?: string;
  entityName: string;
  currentProgress: number;
  targetProgress: number;
  predictedCompletionDate?: string;
  predictedDaysRemaining?: number;
  confidence: 'high' | 'medium' | 'low';
  trend: 'improving' | 'stable' | 'declining';
}

interface CompletionPredictionReportProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
}

const COLORS = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#ef4444',
};

export function CompletionPredictionReport({
  projects,
  hospitals,
  provinces,
}: CompletionPredictionReportProps) {
  const [data, setData] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({ level: 'global' });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric', 'completion_prediction');
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.province) params.append('province', filters.province);
      if (filters.level) params.append('level', filters.level);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Error al cargar datos del reporte');
      }
    } catch (error) {
      console.error('Error loading completion prediction:', error);
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
          reportType: 'completion_prediction',
          format,
          filters,
        }),
      });

      const result = await response.json();
      if (result.success && result.data.content) {
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.data.filename || 'completion-prediction.csv';
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.entityName.length > 15 ? item.entityName.substring(0, 15) + '...' : item.entityName,
    fullName: item.entityName,
    current: typeof item.currentProgress === 'number' && !isNaN(item.currentProgress) ? item.currentProgress : 0,
    target: typeof item.targetProgress === 'number' && !isNaN(item.targetProgress) ? item.targetProgress : 100,
    remaining: typeof item.currentProgress === 'number' && typeof item.targetProgress === 'number' && !isNaN(item.currentProgress) && !isNaN(item.targetProgress)
      ? item.targetProgress - item.currentProgress
      : 0,
    daysRemaining: typeof item.predictedDaysRemaining === 'number' && !isNaN(item.predictedDaysRemaining) && item.predictedDaysRemaining != null
      ? item.predictedDaysRemaining
      : 0,
    confidence: item.confidence,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Calendar className="h-6 w-6" />
            <span>Predicción de Finalización</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Proyección temporal para la finalización del estudio
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
        showLevel={true}
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? (() => {
                    const validProgress = data.filter((d) => typeof d.currentProgress === 'number' && !isNaN(d.currentProgress));
                    if (validProgress.length === 0) return '0';
                    const avg = validProgress.reduce((sum, d) => sum + (d.currentProgress || 0), 0) / validProgress.length;
                    return isNaN(avg) ? '0' : Math.round(avg);
                  })()
                : '0'}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días Promedio Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? (() => {
                    const validDays = data.filter(
                      (d) => typeof d.predictedDaysRemaining === 'number' && !isNaN(d.predictedDaysRemaining) && d.predictedDaysRemaining != null
                    );
                    if (validDays.length === 0) return '0';
                    const avg = validDays.reduce((sum, d) => sum + (d.predictedDaysRemaining || 0), 0) / validDays.length;
                    return isNaN(avg) ? '0' : Math.round(avg);
                  })()
                : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alta Confianza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.filter((d) => d.confidence === 'high').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Progreso */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso Actual vs Objetivo</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'current') return [`${value}%`, 'Progreso Actual'];
                    if (name === 'target') return [`${value}%`, 'Objetivo'];
                    if (name === 'remaining') return [`${value}%`, 'Pendiente'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload;
                    return data?.fullName || label;
                  }}
                />
                <Legend />
                <Bar dataKey="current" fill="#3b82f6" name="Progreso Actual" />
                <Bar dataKey="target" fill="#22c55e" name="Objetivo" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos disponibles para los filtros seleccionados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Predicciones */}
      <Card>
        <CardHeader>
          <CardTitle>Predicciones Detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Entidad</th>
                  <th className="text-center p-2 font-medium">Progreso Actual</th>
                  <th className="text-center p-2 font-medium">Días Restantes</th>
                  <th className="text-center p-2 font-medium">Fecha Predicha</th>
                  <th className="text-center p-2 font-medium">Confianza</th>
                  <th className="text-center p-2 font-medium">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.entityId || item.entityName} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.entityName}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ 
                              width: `${typeof item.currentProgress === 'number' && !isNaN(item.currentProgress) ? Math.max(0, Math.min(100, item.currentProgress)) : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {typeof item.currentProgress === 'number' && !isNaN(item.currentProgress)
                            ? `${Math.round(item.currentProgress)}%`
                            : '0%'}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      {typeof item.predictedDaysRemaining === 'number' && !isNaN(item.predictedDaysRemaining) && item.predictedDaysRemaining != null ? (
                        <Badge variant="secondary">
                          {Math.round(item.predictedDaysRemaining)} días
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {item.predictedCompletionDate ? (
                        formatDate(item.predictedCompletionDate)
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: COLORS[item.confidence],
                          color: COLORS[item.confidence],
                        }}
                      >
                        {item.confidence === 'high' ? 'Alta' : item.confidence === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">{getTrendIcon(item.trend)}</td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

