'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { AdvancedFilters } from '../../../../components/ui/advanced-filters';
import { Pagination } from '../../../../components/ui/pagination';
import { AuditService, AuditLog } from '../../../../lib/audit-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Activity, 
  Users, 
  Shield, 
  Database, 
  Download, 
  Filter,
  Search,
  Calendar,
  User,
  FileText,
  Trash2,
  Edit,
  Eye
} from 'lucide-react';

interface AuditStats {
  totalActions: number;
  actionsToday: number;
  uniqueUsers: number;
  mostActiveUser: string;
  topActions: Array<{ action: string; count: number }>;
  actionsByType: Array<{ type: string; count: number }>;
}

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = async () => {
    setIsLoading(true);
    try {
      const allLogs = AuditService.getLogs();
      setLogs(allLogs);
      calculateStats(allLogs);
    } catch (error) {
      console.error('Error cargando datos de auditoría:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (auditLogs: AuditLog[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actionsToday = auditLogs.filter(log => 
      new Date(log.timestamp) >= today
    ).length;

    const uniqueUsers = new Set(auditLogs.map(log => log.userId)).size;

    const userActionCounts = auditLogs.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveUser = Object.entries(userActionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    const actionCounts = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    const resourceCounts = auditLogs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByType = Object.entries(resourceCounts)
      .map(([type, count]) => ({ type, count }));

    setStats({
      totalActions: auditLogs.length,
      actionsToday,
      uniqueUsers,
      mostActiveUser,
      topActions,
      actionsByType
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser = userFilter === 'all' || log.userId === userFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = logDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesUser && matchesAction && matchesDate;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'crear':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'update':
      case 'actualizar':
      case 'edit':
      case 'editar':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
      case 'eliminar':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'view':
      case 'ver':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      'create': 'bg-green-100 text-green-800',
      'crear': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'actualizar': 'bg-blue-100 text-blue-800',
      'edit': 'bg-blue-100 text-blue-800',
      'editar': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'eliminar': 'bg-red-100 text-red-800',
      'view': 'bg-gray-100 text-gray-800',
      'ver': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[action.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    );
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Usuario', 'Acción', 'Recurso', 'ID Recurso', 'Fecha', 'IP', 'Detalles'],
      ...filteredLogs.map(log => [
        log.userName,
        log.action,
        log.resource,
        log.resourceId,
        format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        log.ipAddress || 'N/A',
        log.details ? JSON.stringify(log.details) : ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Auditoría</h1>
          <p className="text-gray-600 mt-2">Monitoreo y análisis de actividades del sistema</p>
        </div>
        <Button onClick={exportAuditLogs} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Exportar Logs</span>
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Acciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.actionsToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuarios Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Más Activo</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{stats.mostActiveUser}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">Registro de Actividad</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Buscar</label>
                  <Input
                    placeholder="Usuario, acción, recurso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Usuario</label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los usuarios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      {Array.from(new Set(logs.map(log => log.userName))).map(userName => (
                        <SelectItem key={userName} value={userName}>
                          {userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Acción</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las acciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las acciones</SelectItem>
                      {Array.from(new Set(logs.map(log => log.action))).map(action => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Período</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los períodos</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="week">Esta semana</SelectItem>
                      <SelectItem value="month">Este mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de logs */}
          <Card>
            <CardHeader>
              <CardTitle>Registro de Actividad ({filteredLogs.length} registros)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.resource}</div>
                          <div className="text-sm text-gray-500">ID: {log.resourceId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.ipAddress || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(log.details).length} campo{Object.keys(log.details).length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin detalles</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredLogs.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Más Frecuentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.topActions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.action}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actividad por Tipo de Recurso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.actionsByType.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.type}</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
