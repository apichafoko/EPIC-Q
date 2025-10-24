'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  MapPin,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
import { mockHospitals, mockDashboardKPIs } from '../../lib/mock-data';

export default function ReportsPage() {
  const [selectedHospitals, setSelectedHospitals] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [outputFormat, setOutputFormat] = useState('pdf');

  const predefinedReports = [
    {
      id: 'hospital-progress',
      title: 'Estado de Avance por Hospital',
      description: 'Reporte detallado del progreso de cada hospital en el estudio',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'province-comparison',
      title: 'Comparativa por Provincias',
      description: 'Análisis comparativo del rendimiento entre provincias',
      icon: MapPin,
      color: 'bg-green-100 text-green-800'
    },
    {
      id: 'recruitment-velocity',
      title: 'Análisis de Velocidad de Reclutamiento',
      description: 'Evaluación de la velocidad de reclutamiento de casos',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'completion-prediction',
      title: 'Predicción de Finalización',
      description: 'Proyección temporal para la finalización del estudio',
      icon: Calendar,
      color: 'bg-orange-100 text-orange-800'
    }
  ];

  const availableMetrics = [
    { id: 'progress', label: 'Progreso del Estudio', icon: Activity },
    { id: 'cases', label: 'Casos Registrados', icon: FileText },
    { id: 'completion', label: 'Tasa de Completitud', icon: BarChart3 },
    { id: 'communications', label: 'Comunicaciones', icon: Users },
    { id: 'recruitment', label: 'Períodos de Reclutamiento', icon: Calendar }
  ];

  const toggleHospital = (hospitalId: string) => {
    setSelectedHospitals(prev => 
      prev.includes(hospitalId) 
        ? prev.filter(id => id !== hospitalId)
        : [...prev, hospitalId]
    );
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  const selectAllHospitals = () => {
    setSelectedHospitals(mockHospitals.map(h => h.id));
  };

  const clearAllHospitals = () => {
    setSelectedHospitals([]);
  };

  const generateReport = (reportId: string) => {
    console.log('Generando reporte:', reportId);
    // Aquí se implementaría la lógica de generación de reportes
  };

  const generateCustomReport = () => {
    console.log('Generando reporte personalizado:', {
      hospitals: selectedHospitals,
      metrics: selectedMetrics,
      dateRange,
      format: outputFormat
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-2">
            Genera reportes detallados del progreso del estudio EPIC-Q
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar Todos
        </Button>
      </div>

      {/* Resumen Ejecutivo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Resumen Ejecutivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{mockDashboardKPIs.totalHospitals}</div>
              <div className="text-sm text-gray-600">Hospitales Totales</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{mockDashboardKPIs.activeHospitals}</div>
              <div className="text-sm text-gray-600">Hospitales Activos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{mockDashboardKPIs.totalCases.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Casos Registrados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{mockDashboardKPIs.averageCompletion}%</div>
              <div className="text-sm text-gray-600">Completitud Promedio</div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reportes Predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Predefinidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedReports.map((report) => {
              const IconComponent = report.icon;
              return (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${report.color}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => generateReport(report.id)}
                    >
                      Generar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generador Personalizado */}
      <Card>
        <CardHeader>
          <CardTitle>Generador de Reportes Personalizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de Hospitales */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Hospitales a Incluir</h3>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={selectAllHospitals}>
                  Seleccionar Todos
                </Button>
                <Button size="sm" variant="outline" onClick={clearAllHospitals}>
                  Limpiar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {mockHospitals.map((hospital) => (
                <div key={hospital.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={hospital.id}
                    checked={selectedHospitals.includes(hospital.id)}
                    onCheckedChange={() => toggleHospital(hospital.id)}
                  />
                  <label htmlFor={hospital.id} className="text-sm text-gray-700 cursor-pointer">
                    {hospital.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Selección de Métricas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas a Incluir</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMetrics.map((metric) => {
                const IconComponent = metric.icon;
                return (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.id}
                      checked={selectedMetrics.includes(metric.id)}
                      onCheckedChange={() => toggleMetric(metric.id)}
                    />
                    <label htmlFor={metric.id} className="flex items-center space-x-2 cursor-pointer">
                      <IconComponent className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{metric.label}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rango de Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha Desde</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Fecha Hasta</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Formato de Salida */}
          <div>
            <label className="text-sm font-medium text-gray-600">Formato de Salida</label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón de Generación */}
          <div className="flex justify-end">
            <Button 
              onClick={generateCustomReport}
              disabled={selectedHospitals.length === 0 || selectedMetrics.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reportes Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Estado de Avance - Diciembre 2024', date: '2024-12-15', format: 'PDF', size: '2.3 MB' },
              { name: 'Comparativa por Provincias - Q4 2024', date: '2024-12-10', format: 'Excel', size: '1.8 MB' },
              { name: 'Análisis de Velocidad - Noviembre 2024', date: '2024-12-05', format: 'PDF', size: '3.1 MB' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{report.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(report.date).toLocaleDateString('es-AR')} • {report.format} • {report.size}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
