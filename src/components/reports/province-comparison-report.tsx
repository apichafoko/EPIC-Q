'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, ReportFiltersProps } from './report-filters';
import { MapPin, Download } from 'lucide-react';
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

interface ProvinceComparisonData {
  province: string;
  hospitalCount: number;
  totalCases: number;
  averageProgress: number;
  averageCompletion: number;
  activeHospitals: number;
  totalTargetCases?: number;
  totalLoadedCases?: number;
}

interface ProvinceComparisonReportProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function ProvinceComparisonReport({
  projects,
  hospitals,
  provinces,
}: ProvinceComparisonReportProps) {
  const [data, setData] = useState<ProvinceComparisonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReportFilters>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric', 'province_comparison');
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.province) params.append('province', filters.province);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Error al cargar datos del reporte');
      }
    } catch (error) {
      console.error('Error loading province comparison:', error);
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
          reportType: 'province_comparison',
          format,
          filters,
        }),
      });

      const result = await response.json();
      if (result.success && result.data.content) {
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.data.filename || 'province-comparison.csv';
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.totalCases - a.totalCases);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <MapPin className="h-6 w-6" />
            <span>Comparativa por Provincias</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Análisis comparativo del rendimiento entre provincias
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
            <CardTitle className="text-sm font-medium">Total Provincias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hospitales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.hospitalCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.totalCases, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progreso Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0
                ? Math.round(data.reduce((sum, d) => sum + d.averageProgress, 0) / data.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Casos por Provincia</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalCases" fill="#3b82f6" name="Total Casos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progreso Promedio por Provincia</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="province"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Progreso']} />
                  <Legend />
                  <Bar dataKey="averageProgress" fill="#22c55e" name="Progreso %">
                    {sortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla Comparativa */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Provincia</th>
                  <th className="text-center p-2 font-medium">Hospitales</th>
                  <th className="text-center p-2 font-medium">Activos</th>
                  <th className="text-center p-2 font-medium">Total Casos</th>
                  <th className="text-center p-2 font-medium">Progreso Promedio</th>
                  <th className="text-center p-2 font-medium">Completitud Promedio</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item) => (
                  <tr key={item.province} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.province}</td>
                    <td className="p-2 text-center">{item.hospitalCount}</td>
                    <td className="p-2 text-center">
                      <Badge variant="secondary">{item.activeHospitals}</Badge>
                    </td>
                    <td className="p-2 text-center">{item.totalCases}</td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.averageProgress}%` }}
                          />
                        </div>
                        <span className="text-sm">{item.averageProgress}%</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">{item.averageCompletion}%</td>
                  </tr>
                ))}
                {sortedData.length === 0 && (
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

