'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Switch } from '../../../../components/ui/switch';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Loader2, Save, Settings, AlertTriangle, Bell, Mail, Users, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLoadingState } from '../../../../hooks/useLoadingState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Textarea } from '../../../../components/ui/textarea';

interface AlertConfiguration {
  id: string;
  alert_type: string;
  enabled: boolean;
  notify_admin: boolean;
  notify_coordinator: boolean;
  auto_send_email: boolean;
  threshold_value: number | null;
  email_template_id?: string;
}

export default function AlertConfigurationsPage() {
  const [configurations, setConfigurations] = useState<AlertConfiguration[]>([]);
  const { isLoading, startLoading, stopLoading } = useLoadingState();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    alert_type: '',
    enabled: true,
    notify_admin: true,
    notify_coordinator: true,
    auto_send_email: false,
    threshold_value: null as number | null,
    email_template_id: ''
  });

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
      const config = configurations.find(c => c.id === id);
      if (!config) {
        throw new Error('Configuración no encontrada');
      }

      const response = await fetch('/api/alerts/configurations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ alertType: config.alert_type, ...updates })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar configuración');
      }

      // Actualizar estado local
      setConfigurations(prev => 
        prev.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      );

      toast.success('Configuración actualizada');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar configuración');
    }
  };

  const createConfiguration = async () => {
    if (!newConfig.alert_type.trim()) {
      toast.error('El tipo de alerta es requerido');
      return;
    }

    try {
      startLoading();
      const response = await fetch('/api/alerts/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          alert_type: newConfig.alert_type.trim(),
          enabled: newConfig.enabled,
          notify_admin: newConfig.notify_admin,
          notify_coordinator: newConfig.notify_coordinator,
          auto_send_email: newConfig.auto_send_email,
          threshold_value: newConfig.threshold_value,
          email_template_id: newConfig.email_template_id || null,
        })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Error parseando respuesta JSON:', jsonError);
          throw new Error('Error al procesar la respuesta del servidor');
        }
      } else {
        const text = await response.text();
        console.error('Respuesta no JSON del servidor:', text);
        throw new Error(`Error del servidor: ${text || 'Respuesta inválida'}`);
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Error ${response.status}: ${response.statusText}`);
      }

      toast.success(data?.message || 'Configuración creada exitosamente');
      setShowCreateDialog(false);
      setNewConfig({
        alert_type: '',
        enabled: true,
        notify_admin: true,
        notify_coordinator: true,
        auto_send_email: false,
        threshold_value: null,
        email_template_id: ''
      });
      loadConfigurations();
    } catch (error) {
      console.error('Error creating configuration:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al crear configuración. Por favor, intente nuevamente.');
      }
    } finally {
      stopLoading();
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
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Nueva Configuración
        </Button>
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
                <Label htmlFor={`threshold-${config.id}`}>Umbral (días desde invitación)</Label>
                <Input
                  id={`threshold-${config.id}`}
                  type="number"
                  value={config.threshold_value ?? ''}
                  onChange={(e) => 
                    updateConfiguration(config.id, { 
                      threshold_value: e.target.value ? parseInt(e.target.value) : null 
                    })
                  }
                  disabled={!config.enabled}
                  placeholder="Ej: 60"
                />
                <p className="text-sm text-muted-foreground">
                  {config.alert_type === 'missing_documentation' 
                    ? 'Días desde la invitación del coordinador antes de generar la alerta (ej: 60 días)'
                    : config.alert_type === 'ethics_approval_pending'
                    ? 'Días desde la presentación de ética antes de generar la alerta (ej: 30 días)'
                    : config.alert_type === 'upcoming_recruitment_period'
                    ? 'Días antes del período de reclutamiento para generar la alerta (ej: 60 días)'
                    : config.alert_type === 'no_activity_30_days'
                    ? 'Días sin actividad antes de generar la alerta (ej: 30 días)'
                    : config.alert_type === 'low_completion_rate'
                    ? 'Porcentaje mínimo de completitud (ej: 65%)'
                    : 'Valor umbral para generar esta alerta (días, porcentaje, etc.)'
                  }
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

      {/* Dialog para crear nueva configuración */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nueva Configuración de Alerta</DialogTitle>
            <DialogDescription>
              Crea una nueva configuración para un tipo de alerta automática
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-alert-type">Tipo de Alerta *</Label>
              <Input
                id="new-alert-type"
                value={newConfig.alert_type}
                onChange={(e) => setNewConfig({ ...newConfig, alert_type: e.target.value })}
                placeholder="Ej: ethics_approval_pending, missing_documentation, etc."
              />
              <p className="text-sm text-muted-foreground">
                Nombre único del tipo de alerta (puede ser un tipo existente o personalizado)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-enabled">Habilitar alerta</Label>
                <p className="text-sm text-muted-foreground">
                  Activar o desactivar este tipo de alerta
                </p>
              </div>
              <Switch
                id="new-enabled"
                checked={newConfig.enabled}
                onCheckedChange={(checked) => setNewConfig({ ...newConfig, enabled: checked })}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Notificaciones</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-notify-admin" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Notificar Admin</span>
                    </Label>
                  </div>
                  <Switch
                    id="new-notify-admin"
                    checked={newConfig.notify_admin}
                    onCheckedChange={(checked) => setNewConfig({ ...newConfig, notify_admin: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="new-notify-coordinator" className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Notificar Coordinador</span>
                    </Label>
                  </div>
                  <Switch
                    id="new-notify-coordinator"
                    checked={newConfig.notify_coordinator}
                    onCheckedChange={(checked) => setNewConfig({ ...newConfig, notify_coordinator: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-auto-email" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Automático</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar email automáticamente cuando se genere la alerta
                  </p>
                </div>
                <Switch
                  id="new-auto-email"
                  checked={newConfig.auto_send_email}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, auto_send_email: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-threshold">Valor Umbral (Opcional)</Label>
              <Input
                id="new-threshold"
                type="number"
                value={newConfig.threshold_value || ''}
                onChange={(e) => setNewConfig({ 
                  ...newConfig, 
                  threshold_value: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Ej: 60 (días desde invitación para missing_documentation)"
              />
              <p className="text-sm text-muted-foreground">
                Para "missing_documentation": días desde la invitación del coordinador antes de generar la alerta.
                Para otros tipos: días, porcentaje u otro valor según el tipo de alerta.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={createConfiguration} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Crear Configuración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}