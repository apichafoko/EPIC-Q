'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { TrendingUp, BarChart3, Activity, Calendar, MapPin, Users, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TrendData {
  date: string;
  value: number;
  label?: string;
}

interface HeatmapData {
  hospitalId: string;
  hospitalName: string;
  province: string;
  value: number;
  category: string;
}

interface BubbleChartData {
  x: number;
  y: number;
  size: number;
  label: string;
  category: string;
}

interface PerformanceMetrics {
  coordinatorId: string;
  coordinatorName: string;
  casesCreated: number;
  averageCompletion: number;
  responseTime: number;
  alertResolutionRate: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trends');
  const [caseTrends, setCaseTrends] = useState<TrendData[]>([]);
  const [completionTrends, setCompletionTrends] = useState<TrendData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [bubbleData, setBubbleData] = useState<BubbleChartData[]>([]);
  const [coordinatorPerformance, setCoordinatorPerformance] = useState<PerformanceMetrics[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    province: 'all',
  });

  useEffect(() => {
    loadAllData();
  }, [filters]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.province !== 'all') params.append('province', filters.province);

      const [casesRes, completionRes, heatmapRes, bubbleRes, coordRes] = await Promise.all([
        fetch(`/api/analytics?metric=case_trends&${params}`),
        fetch(`/api/analytics?metric=completion_trends&${params}`),
        fetch(`/api/analytics?metric=activity_heatmap&${params}`),
        fetch(`/api/analytics?metric=bubble_chart&${params}`),
        fetch(`/api/analytics?metric=coordinator_performance&${params}`),
      ]);

      const cases = await casesRes.json();
      const completion = await completionRes.json();
      const heatmap = await heatmapRes.json();
      const bubble = await bubbleRes.json();
      const coord = await coordRes.json();

      if (cases.success) setCaseTrends(cases.data);
      if (completion.success) setCompletionTrends(completion.data);
      if (heatmap.success) setHeatmapData(heatmap.data);
      if (bubble.success) setBubbleData(bubble.data);
      if (coord.success) setCoordinatorPerformance(coord.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const getHeatmapColor = (value: number) => {
    if (value >= 80) return '#22c55e'; // green
    if (value >= 50) return '#eab308'; // yellow
    if (value >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  // Preparar datos para heatmap agrupado por provincia
  const heatmapByProvince = heatmapData.reduce((acc, item) => {
    if (!acc[item.province]) {
      acc[item.province] = [];
    }
    acc[item.province].push(item);
    return acc;
  }, {} as Record<string, HeatmapData[]>);

  const provinceHeatmapData = Object.entries(heatmapByProvince).map(([province, hospitals]) => ({
    province,
    averageValue: Math.round(hospitals.reduce((sum, h) => sum + h.value, 0) / hospitals.length),
    count: hospitals.length,
    hospitals,
  }));

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Avanzado</h1>
          <p className="text-muted-foreground mt-2">
            Métricas avanzadas y análisis temporal de datos
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Provincia</Label>
                <Select
                  value={filters.province}
                  onValueChange={(value) => setFilters({ ...filters, province: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las provincias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las provincias</SelectItem>
                    {Array.from(new Set(heatmapData.map(h => h.province))).map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando analytics...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="trends">Tendencias Temporales</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap de Actividad</TabsTrigger>
              <TabsTrigger value="bubble">Análisis de Burbujas</TabsTrigger>
              <TabsTrigger value="performance">Rendimiento Coordinadores</TabsTrigger>
            </TabsList>

            {/* Tendencias Temporales */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Tendencia de Casos Creados</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={caseTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
                          formatter={(value: number) => [value, 'Casos']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Tendencia de Completitud</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={completionTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip
                          labelFormatter={(label) => `Fecha: ${formatDate(label)}`}
                          formatter={(value: number) => [`${value}%`, 'Completitud']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Heatmap */}
            <TabsContent value="heatmap" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Heatmap de Actividad por Provincia</span>
                  </CardTitle>
                  <CardDescription>
                    Actividad combinada de hospitales por provincia
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={provinceHeatmapData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="province"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'averageValue') {
                            return [`${value}%`, 'Actividad Promedio'];
                          }
                          return [value, 'Hospitales'];
                        }}
                        labelFormatter={(label) => `Provincia: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="averageValue" fill="#3b82f6" name="Actividad Promedio (%)" />
                      <Bar dataKey="count" fill="#94a3b8" name="Número de Hospitales" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad por Hospital</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {heatmapData
                      .sort((a, b) => b.value - a.value)
                      .map((item) => (
                        <div
                          key={item.hospitalId}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: getHeatmapColor(item.value) }}
                            />
                            <div>
                              <p className="font-medium">{item.hospitalName}</p>
                              <p className="text-sm text-muted-foreground">{item.province}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge
                              variant={
                                item.category === 'high'
                                  ? 'default'
                                  : item.category === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {item.category}
                            </Badge>
                            <span className="font-semibold">{item.value}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gráfico de Burbujas */}
            <TabsContent value="bubble" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Análisis de Burbujas</span>
                  </CardTitle>
                  <CardDescription>
                    Relación entre Progreso (X), Completitud (Y) y Casos (Tamaño)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={500}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Progreso"
                        label={{ value: 'Progreso (%)', position: 'insideBottom', offset: -5 }}
                        domain={[0, 100]}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="Completitud"
                        label={{ value: 'Completitud (%)', angle: -90, position: 'insideLeft' }}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'x') return [`${value}%`, 'Progreso'];
                          if (name === 'y') return [`${value}%`, 'Completitud'];
                          if (name === 'size') return [value, 'Casos'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Hospital: ${label}`}
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                <p className="font-semibold">{data.label}</p>
                                <p className="text-sm text-muted-foreground">{data.category}</p>
                                <p className="text-sm">Progreso: {data.x}%</p>
                                <p className="text-sm">Completitud: {data.y}%</p>
                                <p className="text-sm">Casos: {data.size}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Hospitales"
                        data={bubbleData}
                        fill="#3b82f6"
                      >
                        {bubbleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.y)} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rendimiento de Coordinadores */}
            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Métricas de Rendimiento de Coordinadores</span>
                  </CardTitle>
                  <CardDescription>
                    Análisis de productividad y eficiencia de coordinadores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Coordinador</TableHead>
                        <TableHead>Casos Creados</TableHead>
                        <TableHead>Completitud Promedio</TableHead>
                        <TableHead>Tiempo de Respuesta</TableHead>
                        <TableHead>Tasa de Resolución</TableHead>
                        <TableHead>Calificación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coordinatorPerformance
                        .sort(
                          (a, b) =>
                            b.averageCompletion +
                            b.casesCreated / 100 -
                            (a.averageCompletion + a.casesCreated / 100)
                        )
                        .map((coord) => {
                          const score =
                            (coord.averageCompletion * 0.4 +
                              (coord.casesCreated > 0 ? 30 : 0) +
                              (100 - coord.responseTime) * 0.2 +
                              coord.alertResolutionRate * 0.1) /
                            1.0;
                          const rating = score >= 80 ? 'Excelente' : score >= 60 ? 'Bueno' : score >= 40 ? 'Regular' : 'Bajo';

                          return (
                            <TableRow key={coord.coordinatorId}>
                              <TableCell className="font-medium">{coord.coordinatorName}</TableCell>
                              <TableCell>{coord.casesCreated}</TableCell>
                              <TableCell>{coord.averageCompletion.toFixed(1)}%</TableCell>
                              <TableCell>{coord.responseTime}h</TableCell>
                              <TableCell>{coord.alertResolutionRate}%</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    rating === 'Excelente'
                                      ? 'default'
                                      : rating === 'Bueno'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {rating}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AuthGuard>
  );
}
