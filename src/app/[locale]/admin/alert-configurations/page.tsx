'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Loader2, Save, Settings, AlertTriangle, Bell, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLoadingState } from '../../../../hooks/useLoadingState';

interface AlertConfiguration {
  id: string;
  alert_type: string;
  enabled: boolean;
  notify_admin: boolean;
  notify_coordinator: boolean;
  auto_send_email: boolean;
  threshold_value: number;
  email_template_id?: string;
}

export default function AlertConfigurationsPage() {
  const [configurations, setConfigurations] = useState<AlertConfiguration[]>([]);
  const { isLoading, startLoading, stopLoading } = useLoadingState();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      startLoading();
      const response = await fetch('/api/alerts/configurations', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al cargar configuraciones');
      }

      const data = await response.json();
      setConfigurations(data.configurations || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Error al cargar configuraciones');
    } finally {
      stopLoading();
    }
  };

  const updateConfiguration = async (id: string, updates: Partial<AlertConfiguration>) => {
    try {
      const response = await fetch('/api/alerts/configurations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, ...updates })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuración');
      }

      // Actualizar estado local
      setConfigurations(prev => 
        prev.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      );

      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Error al actualizar configuración');
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'ethics_approval_pending': 'Aprobación de Ética Pendiente',
      'missing_documentation': 'Documentación Faltante',
      'upcoming_recruitment_period': 'Período de Reclutamiento Próximo',
      'no_activity_30_days': 'Sin Actividad (30 días)',
      'low_completion_rate': 'Tasa de Completitud Baja'
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'ethics_approval_pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'missing_documentation':
        return <Bell className="h-4 w-4 text-red-500" />;
      case 'upcoming_recruitment_period':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'no_activity_30_days':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'low_completion_rate':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Alertas</h1>
          <p className="text-muted-foreground">
            Configura los tipos de alertas y sus notificaciones
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                {getAlertTypeIcon(config.alert_type)}
                <div>
                  <CardTitle className="text-lg">
                    {getAlertTypeLabel(config.alert_type)}
                  </CardTitle>
                  <CardDescription>
                    Configuración de notificaciones para {config.alert_type}
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Badge variant={config.enabled ? "default" : "secondary"}>
                    {config.enabled ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estado general */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`enabled-${config.id}`}>Habilitar alerta</Label>
                  <p className="text-sm text-muted-foreground">
                    Activar o desactivar este tipo de alerta
                  </p>
                </div>
                <Switch
                  id={`enabled-${config.id}`}
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    updateConfiguration(config.id, { enabled: checked })
                  }
                />
              </div>

              {/* Notificaciones */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notificaciones</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`notify-admin-${config.id}`} className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Notificar Admin</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar notificación al administrador
                      </p>
                    </div>
                    <Switch
                      id={`notify-admin-${config.id}`}
                      checked={config.notify_admin}
                      onCheckedChange={(checked) => 
                        updateConfiguration(config.id, { notify_admin: checked })
                      }
                      disabled={!config.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`notify-coordinator-${config.id}`} className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Notificar Coordinador</span>
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar notificación al coordinador
                      </p>
                    </div>
                    <Switch
                      id={`notify-coordinator-${config.id}`}
                      checked={config.notify_coordinator}
                      onCheckedChange={(checked) => 
                        updateConfiguration(config.id, { notify_coordinator: checked })
                      }
                      disabled={!config.enabled}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`auto-email-${config.id}`} className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email Automático</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar email automáticamente cuando se genere la alerta
                    </p>
                  </div>
                  <Switch
                    id={`auto-email-${config.id}`}
                    checked={config.auto_send_email}
                    onCheckedChange={(checked) => 
                      updateConfiguration(config.id, { auto_send_email: checked })
                    }
                    disabled={!config.enabled}
                  />
                </div>
              </div>

              {/* Umbral */}
              <div className="space-y-2">
                <Label htmlFor={`threshold-${config.id}`}>Umbral</Label>
                <Input
                  id={`threshold-${config.id}`}
                  type="number"
                  value={config.threshold_value}
                  onChange={(e) => 
                    updateConfiguration(config.id, { threshold_value: parseInt(e.target.value) || 0 })
                  }
                  disabled={!config.enabled}
                  placeholder="Valor umbral"
                />
                <p className="text-sm text-muted-foreground">
                  Valor umbral para generar esta alerta (días, porcentaje, etc.)
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {configurations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay configuraciones</h3>
            <p className="text-muted-foreground text-center">
              No se encontraron configuraciones de alertas. 
              Ejecuta el script de seed para crear las configuraciones por defecto.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}