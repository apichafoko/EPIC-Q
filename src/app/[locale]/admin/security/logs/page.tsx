'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Shield, AlertTriangle, Lock, Key } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
    search: '',
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.severity !== 'all') params.append('severity', filters.severity);

      const response = await fetch(`/api/security/logs?${params}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data.logs || result.data);
      }
    } catch (error) {
      console.error('Error loading security logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return (
      <Badge className={colors[severity] || 'bg-gray-100 text-gray-800'}>
        {severity}
      </Badge>
    );
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Logs de Seguridad</h1>
          <p className="text-muted-foreground mt-2">
            Registro de eventos de seguridad y acceso del sistema
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="failed_login">Login Fallido</SelectItem>
                  <SelectItem value="rate_limit">Rate Limit</SelectItem>
                  <SelectItem value="suspicious_activity">Actividad Sospechosa</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las severidades</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Bajo</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Seguridad</CardTitle>
            <CardDescription>
              Historial de eventos y accesos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No hay logs disponibles</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at || log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.event_type || log.eventType}</TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell>{log.user_name || log.userName || 'N/A'}</TableCell>
                      <TableCell>{log.ip_address || log.ipAddress || 'N/A'}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted p-1 rounded">
                          {JSON.stringify(log.details).substring(0, 50)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
