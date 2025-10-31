'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download, Eye, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ResourceStats {
  total_resources: number;
  by_category: { category: string; count: number }[];
  by_type: { type: string; count: number }[];
  most_viewed: { resource_id: string; title: string; view_count: number }[];
  most_downloaded: { resource_id: string; title: string; download_count: number }[];
  recent_access: { resource_id: string; title: string; last_accessed: Date }[];
  total_views: number;
  total_downloads: number;
}

interface ResourceStatsDashboardProps {
  projectId?: string;
}

export function ResourceStatsDashboard({ projectId }: ResourceStatsDashboardProps) {
  const [stats, setStats] = useState<ResourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadStats();
  }, [projectId, categoryFilter, typeFilter]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/resources/stats?${params}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        toast.error('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf: 'PDF',
      document: 'Documento',
      video_youtube: 'Video YouTube',
      video_file: 'Video',
      link: 'Link Externo',
    };
    return labels[type] || type;
  };

  // Render - todos los hooks ya fueron llamados arriba
  // No usar early returns después de hooks

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas de Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recursos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_resources}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_views}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descargas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_downloads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Descarga</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total_views > 0
                ? ((stats.total_downloads / stats.total_views) * 100).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {stats.by_category.map((cat) => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category || 'Sin categoría'} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {stats.by_type.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    {getTypeLabel(type.type)} ({type.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Recursos por Categoría</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_category.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay categorías disponibles
                </p>
              ) : (
                stats.by_category.map((cat) => {
                  const percentage =
                    (cat.count / stats.total_resources) * 100;
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {cat.category || 'Sin categoría'}
                        </span>
                        <span className="text-muted-foreground">
                          {cat.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recursos por Tipo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.by_type.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tipos disponibles
                </p>
              ) : (
                stats.by_type.map((type) => {
                  const percentage =
                    (type.count / stats.total_resources) * 100;
                  return (
                    <div key={type.type} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{getTypeLabel(type.type)}</span>
                        <span className="text-muted-foreground">
                          {type.count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Más Vistos y Descargados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Más Vistos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Recursos Más Vistos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.most_viewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de visualizaciones
              </p>
            ) : (
              <div className="space-y-3">
                {stats.most_viewed.map((item, index) => (
                  <div
                    key={item.resource_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.view_count} vistas
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Más Descargados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Recursos Más Descargados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.most_downloaded.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos de descargas
              </p>
            ) : (
              <div className="space-y-3">
                {stats.most_downloaded.map((item, index) => (
                  <div
                    key={item.resource_id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="text-sm font-medium truncate">{item.title}</span>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {item.download_count} descargas
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos Recientes */}
      {stats.recent_access.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Accesos Recientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent_access.map((access) => (
                <div
                  key={access.resource_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium">{access.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(access.last_accessed).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
