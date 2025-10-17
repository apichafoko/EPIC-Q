'use client';

import { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Alert, alertTypes, alertSeverities } from '@/types';
import { mockAlerts, getHospitalById } from '@/lib/mock-data';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');

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

  const filteredAlerts = useMemo(() => {
    let filtered = mockAlerts;

    // Filtrar por estado
    if (activeTab === 'active') {
      filtered = filtered.filter(alert => !alert.is_resolved);
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(alert => alert.is_resolved);
    }

    // Aplicar filtros adicionales
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.alert_type === typeFilter);
    }

    if (severityFilter && severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    if (hospitalFilter && hospitalFilter !== 'all') {
      filtered = filtered.filter(alert => alert.hospital_id === hospitalFilter);
    }

    // Ordenar por severidad y fecha
    return filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity as keyof typeof severityOrder] - 
                          severityOrder[b.severity as keyof typeof severityOrder];
      
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activeTab, typeFilter, severityFilter, hospitalFilter]);

  const stats = useMemo(() => {
    const total = mockAlerts.length;
    const active = mockAlerts.filter(a => !a.is_resolved).length;
    const resolved = mockAlerts.filter(a => a.is_resolved).length;
    const critical = mockAlerts.filter(a => !a.is_resolved && a.severity === 'critical').length;
    const high = mockAlerts.filter(a => !a.is_resolved && a.severity === 'high').length;
    const medium = mockAlerts.filter(a => !a.is_resolved && a.severity === 'medium').length;
    const low = mockAlerts.filter(a => !a.is_resolved && a.severity === 'low').length;

    return { total, active, resolved, critical, high, medium, low };
  }, []);

  const resolveAlert = (alertId: string) => {
    console.log('Resolviendo alerta:', alertId);
    // Aquí se implementaría la lógica para resolver la alerta
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
        <Button>
          <AlertTriangle className="h-4 w-4 mr-2" />
          Nueva Alerta
        </Button>
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

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                {alertSeverities.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(severity)}
                      <span>{getSeverityLabel(severity)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hospitales</SelectItem>
                {Array.from(new Set(mockAlerts.map(a => a.hospital_id))).map((hospitalId) => {
                  const hospital = getHospitalById(hospitalId);
                  return (
                    <SelectItem key={hospitalId} value={hospitalId}>
                      {hospital?.name || 'Hospital no encontrado'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setTypeFilter('all');
                setSeverityFilter('all');
                setHospitalFilter('all');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const hospital = getHospitalById(alert.hospital_id);
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
                          <Badge variant="outline">
                            {getTypeLabel(alert.alert_type)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{alert.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Link 
                            href={`/hospitals/${alert.hospital_id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {hospital?.name || 'Hospital no encontrado'}
                          </Link>
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
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolver
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
