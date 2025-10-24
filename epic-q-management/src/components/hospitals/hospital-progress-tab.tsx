import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { CheckCircle, Clock, XCircle, Calendar, Users, FileText } from 'lucide-react';
import { Hospital, HospitalProgress } from '../../types';

interface HospitalProgressTabProps {
  hospital: Hospital;
  progress: HospitalProgress | undefined;
}

export function HospitalProgressTab({ hospital, progress }: HospitalProgressTabProps) {
  if (!progress) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay información de progreso disponible</p>
      </div>
    );
  }

  const getStatusIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-400" />
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      complete: { label: 'Completo', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      partial: { label: 'Parcial', color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCollaboratorStatus = (status: string, num: number) => {
    switch (status) {
      case 'yes':
        return { label: 'Todos creados', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'partial':
        return { label: 'Parcial', color: 'bg-orange-100 text-orange-800', icon: Clock };
      case 'no':
        return { label: 'Ninguno', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { label: 'Desconocido', color: 'bg-gray-100 text-gray-800', icon: Clock };
    }
  };

  const collaboratorStatus = getCollaboratorStatus(progress.collaborator_users_created, progress.num_collaborators);
  const CollaboratorIcon = collaboratorStatus.icon;

  return (
    <div className="space-y-6">
      {/* Progreso General */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Progreso General del Estudio</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Progreso Total</span>
              <span className="text-2xl font-bold text-gray-900">{hospital.progress_percentage}%</span>
            </div>
            <Progress value={hospital.progress_percentage} className="h-3" />
            <div className="text-sm text-gray-500">
              {hospital.progress_percentage >= 100 
                ? 'Estudio completado exitosamente' 
                : `${100 - hospital.progress_percentage}% restante para completar`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Progreso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.descriptive_form_status === 'complete')}
                <span className="text-sm font-medium">Formulario Descriptivo</span>
              </div>
              {getStatusBadge(progress.descriptive_form_status)}
            </div>
          </CardContent>
        </Card>

        {/* Aprobaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aprobaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.ethics_submitted)}
                <span className="text-sm font-medium">Presentado a Comité de Ética</span>
              </div>
              <div className="text-right">
                {progress.ethics_submitted && progress.ethics_submitted_date && (
                  <div className="text-xs text-gray-500">
                    {new Date(progress.ethics_submitted_date).toLocaleDateString('es-AR')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.ethics_approved)}
                <span className="text-sm font-medium">Aprobado por Comité de Ética</span>
              </div>
              <div className="text-right">
                {progress.ethics_approved && progress.ethics_approved_date && (
                  <div className="text-xs text-gray-500">
                    {new Date(progress.ethics_approved_date).toLocaleDateString('es-AR')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración RedCap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración RedCap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.redcap_unit_created)}
                <span className="text-sm font-medium">Unidad Creada en RedCap</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.coordinator_user_created)}
                <span className="text-sm font-medium">Usuario Coordinador Creado</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CollaboratorIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium">Usuarios Colaboradores</span>
              </div>
              <div className="text-right">
                <Badge className={collaboratorStatus.color}>
                  {collaboratorStatus.label}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  {progress.num_collaborators} colaboradores
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preparación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preparación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.ready_for_recruitment)}
                <span className="text-sm font-medium">Listo para Reclutamiento</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.dates_assigned_period1)}
                <span className="text-sm font-medium">Fechas Asignadas - Período 1</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(progress.dates_assigned_period2)}
                <span className="text-sm font-medium">Fechas Asignadas - Período 2</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Timeline de Progreso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${progress.descriptive_form_status === 'complete' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Formulario Descriptivo</span>
              {progress.descriptive_form_status === 'complete' && (
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${progress.ethics_submitted ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Ética Presentada</span>
              {progress.ethics_submitted && (
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${progress.ethics_approved ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Ética Aprobada</span>
              {progress.ethics_approved && (
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${progress.redcap_unit_created ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">RedCap Configurado</span>
              {progress.redcap_unit_created && (
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${progress.ready_for_recruitment ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Listo para Reclutamiento</span>
              {progress.ready_for_recruitment && (
                <Badge className="bg-green-100 text-green-800">Completado</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fechas de Contacto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Fechas de Seguimiento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {progress.last_contact_date && (
              <div>
                <label className="text-sm font-medium text-gray-600">Último Contacto</label>
                <p className="text-sm text-gray-900">
                  {new Date(progress.last_contact_date).toLocaleDateString('es-AR')}
                </p>
              </div>
            )}
            {progress.next_followup_date && (
              <div>
                <label className="text-sm font-medium text-gray-600">Próximo Seguimiento</label>
                <p className="text-sm text-gray-900">
                  {new Date(progress.next_followup_date).toLocaleDateString('es-AR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botón de Actualización */}
      <div className="flex justify-end">
        <Button>
          Actualizar Progreso
        </Button>
      </div>
    </div>
  );
}
