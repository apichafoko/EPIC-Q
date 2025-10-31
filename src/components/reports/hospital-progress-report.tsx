'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, ReportFiltersProps } from './report-filters';
import { BarChart3, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
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

interface HospitalProgressData {
  hospitalId: string;
  hospitalName: string;
  province: string;
  progressPercentage: number;
  casesCreated: number;
  completionPercentage: number;
  status: string;
  ethicsSubmitted: boolean;
  ethicsApproved: boolean;
  lastActivity?: string;
  targetCases?: number;
  currentPeriod?: number;
  totalPeriods?: number;
}

interface HospitalProgressReportProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
}

export function HospitalProgressReport({
  projects,
  hospitals,
  provinces,
}: HospitalProgressReportProps) {
  const [data, setData] = useState<HospitalProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric', 'hospital_progress');
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.province) params.append('province', filters.province);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Error al cargar datos del reporte');
      }
    } catch (error) {
      console.error('Error loading hospital progress:', error);
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
          reportType: 'hospital_progress',
          format,
          filters: {
            projectId: filters.projectId,
            hospitalId: filters.hospitalId,
            province: filters.province,
          },
        }),
      });

      const result = await response.json();
      if (result.success && result.data.content) {
        // Descargar CSV
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.data.filename || 'hospital-progress.csv';
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'active_recruiting':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const chartData = data.map((item) => ({
    name: item.hospitalName.length > 20 ? item.hospitalName.substring(0, 20) + '...' : item.hospitalName,
    fullName: item.hospitalName,
    progress: item.progressPercentage,
    cases: item.casesCreated,
    completion: item.completionPercentage,
    province: item.province,
  }));

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
            <BarChart3 className="h-6 w-6" />
            <span>Estado de Avance por Hospital</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Reporte detallado del progreso de cada hospital en el estudio
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
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? Math.round(data.reduce((sum, d) => sum + d.progressPercentage, 0) / data.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ética Aprobada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.filter((d) => d.ethicsApproved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.casesCreated, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Hospital</CardTitle>
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
                    if (name === 'progress') return [`${value}%`, 'Progreso'];
                    if (name === 'completion') return [`${value}%`, 'Completitud'];
                    return [value, 'Casos'];
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload;
                    return data?.fullName || label;
                  }}
                />
                <Legend />
                <Bar dataKey="progress" fill="#3b82f6" name="Progreso %" />
                <Bar dataKey="completion" fill="#22c55e" name="Completitud %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos disponibles para los filtros seleccionados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Detalle */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Hospital</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Hospital</th>
                  <th className="text-left p-2 font-medium">Provincia</th>
                  <th className="text-center p-2 font-medium">Progreso</th>
                  <th className="text-center p-2 font-medium">Casos</th>
                  <th className="text-center p-2 font-medium">Completitud</th>
                  <th className="text-center p-2 font-medium">Estado</th>
                  <th className="text-center p-2 font-medium">Ética</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.hospitalId} className="border-b hover:bg-muted/50">
                    <td className="p-2">{item.hospitalName}</td>
                    <td className="p-2">{item.province}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">{item.casesCreated}</td>
                    <td className="p-2 text-center">{item.completionPercentage}%</td>
                    <td className="p-2 text-center">
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(item.status)} text-white`}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {item.ethicsSubmitted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        {item.ethicsApproved ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
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

