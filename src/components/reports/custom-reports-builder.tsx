'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportFilters, ReportFiltersProps } from './report-filters';
import { 
  FileText, 
  Download, 
  Plus, 
  X, 
  Eye, 
  Settings,
  BarChart3,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MetricOption {
  id: string;
  label: string;
  type: 'number' | 'percentage' | 'date' | 'text';
  availableIn: string[]; // Tipos de reportes donde está disponible
}

interface CustomReportConfig {
  name: string;
  description?: string;
  metrics: string[];
  filters: ReportFilters;
  groupBy?: 'hospital' | 'province' | 'project' | 'none';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CustomReportsBuilderProps {
  projects?: Array<{ id: string; name: string }>;
  hospitals?: Array<{ id: string; name: string }>;
  provinces?: string[];
}

const AVAILABLE_METRICS: MetricOption[] = [
  { id: 'hospital_name', label: 'Nombre del Hospital', type: 'text', availableIn: ['hospital_progress'] },
  { id: 'province', label: 'Provincia', type: 'text', availableIn: ['hospital_progress', 'province_comparison'] },
  { id: 'progress_percentage', label: 'Progreso %', type: 'percentage', availableIn: ['hospital_progress', 'province_comparison'] },
  { id: 'cases_created', label: 'Casos Creados', type: 'number', availableIn: ['hospital_progress', 'recruitment_velocity'] },
  { id: 'completion_percentage', label: 'Completitud %', type: 'percentage', availableIn: ['hospital_progress', 'province_comparison'] },
  { id: 'status', label: 'Estado', type: 'text', availableIn: ['hospital_progress'] },
  { id: 'ethics_submitted', label: 'Ética Enviada', type: 'text', availableIn: ['hospital_progress'] },
  { id: 'ethics_approved', label: 'Ética Aprobada', type: 'text', availableIn: ['hospital_progress'] },
  { id: 'total_cases', label: 'Total Casos', type: 'number', availableIn: ['province_comparison', 'recruitment_velocity'] },
  { id: 'hospital_count', label: 'Cantidad de Hospitales', type: 'number', availableIn: ['province_comparison'] },
  { id: 'active_hospitals', label: 'Hospitales Activos', type: 'number', availableIn: ['province_comparison'] },
  { id: 'average_progress', label: 'Progreso Promedio', type: 'percentage', availableIn: ['province_comparison'] },
  { id: 'average_completion', label: 'Completitud Promedio', type: 'percentage', availableIn: ['province_comparison'] },
  { id: 'date', label: 'Fecha', type: 'date', availableIn: ['recruitment_velocity'] },
  { id: 'cumulative_cases', label: 'Casos Acumulados', type: 'number', availableIn: ['recruitment_velocity'] },
  { id: 'velocity', label: 'Velocidad (casos/día)', type: 'number', availableIn: ['recruitment_velocity'] },
  { id: 'predicted_completion_date', label: 'Fecha Predicha de Finalización', type: 'date', availableIn: ['completion_prediction'] },
  { id: 'predicted_days_remaining', label: 'Días Restantes', type: 'number', availableIn: ['completion_prediction'] },
  { id: 'current_progress', label: 'Progreso Actual', type: 'percentage', availableIn: ['completion_prediction'] },
  { id: 'confidence', label: 'Confianza', type: 'text', availableIn: ['completion_prediction'] },
  { id: 'trend', label: 'Tendencia', type: 'text', availableIn: ['completion_prediction'] },
];

const REPORT_TYPES = [
  { id: 'hospital_progress', label: 'Avance por Hospital', icon: BarChart3 },
  { id: 'recruitment_velocity', label: 'Velocidad de Reclutamiento', icon: TrendingUp },
  { id: 'province_comparison', label: 'Comparativa por Provincias', icon: MapPin },
  { id: 'completion_prediction', label: 'Predicción de Finalización', icon: Calendar },
];

export function CustomReportsBuilder({
  projects,
  hospitals,
  provinces,
}: CustomReportsBuilderProps) {
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const [config, setConfig] = useState<CustomReportConfig>({
    name: '',
    description: '',
    metrics: [],
    filters: {},
    groupBy: 'none',
    sortBy: '',
    sortOrder: 'asc',
  });
  const [reportType, setReportType] = useState<string>('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const availableMetrics = reportType
    ? AVAILABLE_METRICS.filter((m) => m.availableIn.includes(reportType))
    : [];

  const toggleMetric = (metricId: string) => {
    setConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((id) => id !== metricId)
        : [...prev.metrics, metricId],
    }));
  };

  const handlePreview = async () => {
    if (!reportType || config.metrics.length === 0) {
      toast.error('Selecciona un tipo de reporte y al menos una métrica');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric', reportType);
      if (config.filters.projectId) params.append('projectId', config.filters.projectId);
      if (config.filters.hospitalId) params.append('hospitalId', config.filters.hospitalId);
      if (config.filters.province) params.append('province', config.filters.province);
      if (config.filters.dateFrom) params.append('dateFrom', config.filters.dateFrom);
      if (config.filters.dateTo) params.append('dateTo', config.filters.dateTo);
      if (config.filters.granularity) params.append('granularity', config.filters.granularity);
      if (config.filters.level) params.append('level', config.filters.level);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Filtrar y formatear datos según métricas seleccionadas
        const formatted = result.data.map((item: any) => {
          const row: any = {};
          config.metrics.forEach((metricId) => {
            const metric = AVAILABLE_METRICS.find((m) => m.id === metricId);
            if (metric) {
              // Mapear campos según el tipo de reporte
              switch (metricId) {
                case 'hospital_name':
                  row[metric.label] = item.hospitalName || item.entityName || '-';
                  break;
                case 'province':
                  row[metric.label] = item.province || '-';
                  break;
                case 'progress_percentage':
                  row[metric.label] = item.progressPercentage || item.currentProgress || item.averageProgress || '-';
                  break;
                case 'cases_created':
                  row[metric.label] = item.casesCreated || '-';
                  break;
                case 'completion_percentage':
                  row[metric.label] = item.completionPercentage || item.averageCompletion || '-';
                  break;
                case 'status':
                  row[metric.label] = item.status || '-';
                  break;
                case 'ethics_submitted':
                  row[metric.label] = item.ethicsSubmitted ? 'Sí' : 'No';
                  break;
                case 'ethics_approved':
                  row[metric.label] = item.ethicsApproved ? 'Sí' : 'No';
                  break;
                case 'total_cases':
                  row[metric.label] = item.totalCases || item.casesCreated || '-';
                  break;
                case 'hospital_count':
                  row[metric.label] = item.hospitalCount || '-';
                  break;
                case 'active_hospitals':
                  row[metric.label] = item.activeHospitals || '-';
                  break;
                case 'average_progress':
                  row[metric.label] = item.averageProgress || '-';
                  break;
                case 'average_completion':
                  row[metric.label] = item.averageCompletion || '-';
                  break;
                case 'date':
                  row[metric.label] = item.date ? new Date(item.date).toLocaleDateString() : '-';
                  break;
                case 'cumulative_cases':
                  row[metric.label] = item.cumulativeCases || '-';
                  break;
                case 'velocity':
                  row[metric.label] = item.velocity?.toFixed(2) || '-';
                  break;
                case 'predicted_completion_date':
                  row[metric.label] = item.predictedCompletionDate
                    ? new Date(item.predictedCompletionDate).toLocaleDateString()
                    : '-';
                  break;
                case 'predicted_days_remaining':
                  row[metric.label] = item.predictedDaysRemaining || '-';
                  break;
                case 'current_progress':
                  row[metric.label] = item.currentProgress || '-';
                  break;
                case 'confidence':
                  row[metric.label] =
                    item.confidence === 'high' ? 'Alta' : item.confidence === 'medium' ? 'Media' : 'Baja';
                  break;
                case 'trend':
                  row[metric.label] =
                    item.trend === 'improving' ? 'Mejorando' : item.trend === 'declining' ? 'Declinando' : 'Estable';
                  break;
                default:
                  row[metric.label] = '-';
              }
            }
          });
          return row;
        });

        // Aplicar ordenamiento si se especificó
        if (config.sortBy) {
          formatted.sort((a: any, b: any) => {
            const aVal = a[config.sortBy!];
            const bVal = b[config.sortBy!];
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return config.sortOrder === 'desc' ? -comparison : comparison;
          });
        }

        setPreviewData(formatted);
        setStep('preview');
        toast.success('Vista previa generada exitosamente');
      } else {
        toast.error('Error al generar vista previa');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Error al generar vista previa');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (previewData.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      // Construir CSV manualmente
      if (format === 'csv') {
        const headers = config.metrics.map((id) => {
          const metric = AVAILABLE_METRICS.find((m) => m.id === id);
          return metric?.label || id;
        });

        const rows = previewData.map((row) =>
          headers.map((header) => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value || '';
          })
        );

        const csv = [
          headers.join(','),
          ...rows.map((row) => row.join(',')),
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${config.name || 'custom-report'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success('Reporte exportado exitosamente');
      } else {
        toast.info('La exportación a Excel y PDF se implementará próximamente');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar reporte');
    }
  };

  if (step === 'preview') {
    const headers = config.metrics
      .map((id) => AVAILABLE_METRICS.find((m) => m.id === id)?.label)
      .filter(Boolean) as string[];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <Eye className="h-6 w-6" />
              <span>Vista Previa del Reporte</span>
            </h2>
            <p className="text-muted-foreground mt-1">{config.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setStep('config')}>
              Volver a Configuración
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos del Reporte</CardTitle>
            <CardDescription>
              {previewData.length} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="text-center py-8 text-muted-foreground">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewData.map((row, index) => (
                      <TableRow key={index}>
                        {headers.map((header) => (
                          <TableCell key={header}>{row[header] || '-'}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <span>Constructor de Reportes Personalizados</span>
        </h2>
        <p className="text-muted-foreground mt-1">
          Crea reportes personalizados seleccionando métricas y filtros específicos
        </p>
      </div>

      {/* Configuración Básica */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-name">Nombre del Reporte</Label>
            <Input
              id="report-name"
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Reporte de Progreso Q1 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Descripción (opcional)</Label>
            <Input
              id="report-description"
              value={config.description || ''}
              onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del reporte..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Reporte</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Selecciona un tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <ReportFilters
        projects={projects}
        hospitals={hospitals}
        provinces={provinces}
        onFiltersChange={(filters) => setConfig((prev) => ({ ...prev, filters }))}
        showGranularity={reportType === 'recruitment_velocity'}
        showLevel={reportType === 'completion_prediction'}
      />

      {/* Métricas */}
      {reportType && (
        <Card>
          <CardHeader>
            <CardTitle>Métricas a Incluir</CardTitle>
            <CardDescription>
              Selecciona las métricas que deseas incluir en el reporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableMetrics.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Selecciona primero un tipo de reporte para ver las métricas disponibles
              </p>
            ) : (
              <div className="space-y-3">
                {availableMetrics.map((metric) => (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={config.metrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                    />
                    <label
                      htmlFor={metric.id}
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                    >
                      <span>{metric.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {metric.type}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ordenamiento */}
      {reportType && config.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ordenamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort-by">Ordenar por</Label>
                <Select
                  value={config.sortBy || ''}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger id="sort-by">
                    <SelectValue placeholder="Sin ordenamiento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin ordenamiento</SelectItem>
                    {config.metrics.map((metricId) => {
                      const metric = AVAILABLE_METRICS.find((m) => m.id === metricId);
                      return metric ? (
                        <SelectItem key={metricId} value={metric.label}>
                          {metric.label}
                        </SelectItem>
                      ) : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {config.sortBy && (
                <div className="space-y-2">
                  <Label htmlFor="sort-order">Orden</Label>
                  <Select
                    value={config.sortOrder || 'asc'}
                    onValueChange={(value) =>
                      setConfig((prev) => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))
                    }
                  >
                    <SelectTrigger id="sort-order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setConfig({
              name: '',
              description: '',
              metrics: [],
              filters: {},
              groupBy: 'none',
              sortBy: '',
              sortOrder: 'asc',
            });
            setReportType('');
            setPreviewData([]);
          }}
        >
          Limpiar
        </Button>
        <Button
          onClick={handlePreview}
          disabled={!reportType || config.metrics.length === 0 || loading}
        >
          {loading ? (
            <>
              <Skeleton className="h-4 w-4 mr-2" />
              Generando...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Generar Vista Previa
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

