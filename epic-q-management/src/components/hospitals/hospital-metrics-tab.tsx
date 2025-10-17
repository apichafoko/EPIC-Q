'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import { CaseMetrics } from '@/types';

interface HospitalMetricsTabProps {
  metrics: CaseMetrics[];
  hospitalName: string;
}

export function HospitalMetricsTab({ metrics, hospitalName }: HospitalMetricsTabProps) {
  // Calcular KPIs
  const totalCasesCreated = metrics.reduce((sum, m) => sum + m.cases_created, 0);
  const totalCasesCompleted = metrics.reduce((sum, m) => sum + m.cases_completed, 0);
  const averageCompletion = totalCasesCreated > 0 ? Math.round((totalCasesCompleted / totalCasesCreated) * 100) : 0;
  const lastActivity = metrics
    .filter(m => m.last_case_date)
    .sort((a, b) => new Date(b.last_case_date!).getTime() - new Date(a.last_case_date!).getTime())[0];

  // Verificar alertas
  const daysSinceLastActivity = lastActivity?.last_case_date 
    ? Math.floor((new Date().getTime() - new Date(lastActivity.last_case_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const hasInactivityAlert = daysSinceLastActivity && daysSinceLastActivity > 30;
  const hasLowCompletionAlert = averageCompletion < 70;

  // Preparar datos para gráficos
  const lineChartData = metrics
    .sort((a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime())
    .map(metric => ({
      date: new Date(metric.recorded_date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' }),
      casesCreated: metric.cases_created,
      casesCompleted: metric.cases_completed,
      completionRate: metric.completion_percentage
    }));

  const weeklyData = metrics
    .reduce((acc, metric) => {
      const week = new Date(metric.recorded_date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.week === week);
      if (existing) {
        existing.casesCreated += metric.cases_created;
        existing.casesCompleted += metric.cases_completed;
      } else {
        acc.push({
          week,
          casesCreated: metric.cases_created,
          casesCompleted: metric.cases_completed
        });
      }
      return acc;
    }, [] as Array<{ week: string; casesCreated: number; casesCompleted: number }>)
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

  // Últimos casos registrados
  const recentCases = metrics
    .filter(m => m.cases_created > 0)
    .sort((a, b) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCasesCreated}</div>
                <div className="text-sm text-gray-600">Casos Creados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCasesCompleted}</div>
                <div className="text-sm text-gray-600">Casos Completos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{averageCompletion}%</div>
                <div className="text-sm text-gray-600">Completitud</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {lastActivity ? new Date(lastActivity.last_case_date!).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '-'}
                </div>
                <div className="text-sm text-gray-600">Última Actividad</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(hasInactivityAlert || hasLowCompletionAlert) && (
        <div className="space-y-3">
          {hasInactivityAlert && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Alerta de Inactividad:</strong> No se han registrado casos en los últimos {daysSinceLastActivity} días. 
                Se recomienda contactar al hospital.
              </AlertDescription>
            </Alert>
          )}
          {hasLowCompletionAlert && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Alerta de Baja Completitud:</strong> La completitud de casos ({averageCompletion}%) está por debajo del objetivo del 70%. 
                Se recomienda revisar los casos pendientes.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolución de Casos */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'casesCreated' ? 'Casos Creados' : 
                    name === 'casesCompleted' ? 'Casos Completos' : 'Tasa de Completitud (%)'
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="casesCreated" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="casesCreated"
                />
                <Line 
                  type="monotone" 
                  dataKey="casesCompleted" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="casesCompleted"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Casos por Semana */}
        <Card>
          <CardHeader>
            <CardTitle>Casos por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'casesCreated' ? 'Casos Creados' : 'Casos Completos'
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="casesCreated" 
                  fill="#3b82f6"
                  name="casesCreated"
                />
                <Bar 
                  dataKey="casesCompleted" 
                  fill="#10b981"
                  name="casesCompleted"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Casos Registrados */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos 10 Casos Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCases.length > 0 ? (
            <div className="space-y-3">
              {recentCases.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(metric.recorded_date).toLocaleDateString('es-AR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {metric.cases_created} casos creados, {metric.cases_completed} completos
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={
                      metric.completion_percentage >= 70 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }>
                      {metric.completion_percentage}%
                    </Badge>
                    {metric.last_case_date && (
                      <div className="text-xs text-gray-500">
                        Último: {new Date(metric.last_case_date).toLocaleDateString('es-AR')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay casos registrados aún</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
