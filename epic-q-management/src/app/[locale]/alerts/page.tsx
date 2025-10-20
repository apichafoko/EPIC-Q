'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Filter,
  Eye,
  Check,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertFilters } from '@/types';
import { toast } from 'sonner';
import { useLoadingState } from '@/hooks/useLoadingState';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState<AlertFilters>({
    search: '',
    severity: 'all',
    status: 'active',
    hospital_id: 'all'
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const [severities, setSeverities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [alertTypes, setAlertTypes] = useState<string[]>([]);
  const [resolvingAlert, setResolvingAlert] = useState<string | null>(null);

  const { isLoading, executeWithLoading } = useLoadingState();

  // Funciones para llamar a los endpoints API
  const fetchAlerts = async (filters: AlertFilters, page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: filters.search || '',
      type: filters.type || 'all',
      status: filters.status || 'all',
      hospital_id: filters.hospital_id || 'all'
    });

    const response = await fetch(`/api/alerts?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al cargar alertas');
    }

    return response.json();
  };

  const fetchAlertStats = async () => {
    const response = await fetch('/api/alerts/stats', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }

    const data = await response.json();
    return data;
  };

  const fetchAlertTypes = async () => {
    const response = await fetch('/api/alerts/types', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Error al cargar tipos de alertas');
    }

    const data = await response.json();
    return data.types || [];
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Desconocida';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'no_activity_30_days':
        return 'Sin Actividad 30+ Días';
      case 'low_completion_rate':
        return 'Baja Completitud';
      case 'upcoming_recruitment_period':
        return 'Período Próximo';
      case 'ethics_approval_pending':
        return 'Ética Pendiente';
      case 'missing_documentation':
        return 'Documentación Faltante';
      default:
        return type;
    }
  };

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentFilters = {
          ...filters,
          status: activeTab === 'all' ? 'all' : activeTab
        };
        
        const [alertsData, typesData, statsData] = await Promise.all([
          fetchAlerts(currentFilters, currentPage, 25),
          fetchAlertTypes(),
          fetchAlertStats()
        ]);

        setAlerts(alertsData.alerts);
        setTotalPages(alertsData.totalPages);
        setStats(statsData);
        
        // Severidades hardcodeadas
        setSeverities(['critical', 'high', 'medium', 'low']);
        
        // Usar tipos de alerta de la API con fallback
        setAlertTypes(Array.isArray(typesData) ? typesData : [
          'no_activity_30_days',
          'low_completion_rate',
          'upcoming_recruitment_period',
          'ethics_approval_pending',
          'missing_documentation'
        ]);
      } catch (error) {
        console.error('Error loading alerts data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, activeTab, currentPage]);

  const resolveAlert = async (alertId: string) => {
    setResolvingAlert(alertId);
    
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Alerta resuelta exitosamente');
        // Recargar datos
        const currentFilters = {
          ...filters,
          status: activeTab === 'all' ? 'all' : activeTab
        };
        const alertsData = await fetchAlerts(currentFilters, currentPage, 25);
        setAlerts(alertsData.alerts);
        
        // Actualizar stats
        const statsData = await fetchAlertStats();
        setStats(statsData);
      } else {
        toast.error(data.error || 'Error resolviendo alerta');
      }
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
      toast.error('Error resolviendo alerta');
    } finally {
      setResolvingAlert(null);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      const currentFilters = {
        ...filters,
        status: activeTab === 'all' ? 'all' : activeTab
      };
      
      const [alertsData, statsData] = await Promise.all([
        fetchAlerts(currentFilters, currentPage, 25),
        fetchAlertStats()
      ]);

      setAlerts(alertsData.alerts);
      setTotalPages(alertsData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Error actualizando datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600 mt-2">
            Monitorea y gestiona las alertas del sistema EPIC-Q
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Link href="/admin/alert-configurations">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Alertas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Activas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resueltas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.critical + stats.high}</div>
            <div className="text-sm text-gray-600">Críticas/Altas</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'active', label: 'Activas', count: stats.active },
          { id: 'resolved', label: 'Resueltas', count: stats.resolved },
          { id: 'all', label: 'Todas', count: stats.total }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de alerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {alertTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                {severities.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(severity)}
                      <span>{getSeverityLabel(severity)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setFilters({ search: '', severity: 'all', status: 'active', hospital_id: 'all' })}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-l-4 border-l-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : alerts.length > 0 ? (
          alerts.map((alert) => {
            const daysActive = Math.floor(
              (new Date().getTime() - new Date(alert.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={alert.id} className={`border-l-4 ${
                alert.severity === 'critical' ? 'border-l-red-500' :
                alert.severity === 'high' ? 'border-l-orange-500' :
                alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getSeverityIcon(alert.severity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {getSeverityLabel(alert.severity)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="text-blue-600">
                            {alert.hospital_name}
                          </span>
                          <span>
                            {new Date(alert.created_at).toLocaleDateString('es-AR')}
                          </span>
                          <span>
                            {daysActive} días activa
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {!alert.is_resolved && (
                        <Button 
                          size="sm" 
                          onClick={() => resolveAlert(alert.id)}
                          disabled={resolvingAlert === alert.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {resolvingAlert === alert.id ? 'Resolviendo...' : 'Resolver'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'active' ? 'No hay alertas activas' : 'No hay alertas resueltas'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'active' 
                    ? 'Todas las alertas han sido resueltas o no hay alertas pendientes.'
                    : 'No se han resuelto alertas aún.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Distribución por Severidad */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Severidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-sm text-gray-600">Críticas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.high}</div>
              <div className="text-sm text-gray-600">Altas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-sm text-gray-600">Medias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.low}</div>
              <div className="text-sm text-gray-600">Bajas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
