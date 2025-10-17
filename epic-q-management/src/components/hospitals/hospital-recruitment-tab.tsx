import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Edit, X, Clock, CheckCircle } from 'lucide-react';
import { RecruitmentPeriod } from '@/types';

interface HospitalRecruitmentTabProps {
  periods: RecruitmentPeriod[];
}

export function HospitalRecruitmentTab({ periods }: HospitalRecruitmentTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'planned':
        return 'Planificado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-green-600" />;
      case 'planned':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isPeriodValid = (period: RecruitmentPeriod) => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    
    // Debe iniciar en lunes
    const isMonday = startDate.getDay() === 1;
    
    // Debe ser exactamente 7 días
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isSevenDays = diffDays === 6; // 6 días de diferencia = 7 días total
    
    return isMonday && isSevenDays;
  };

  const getValidationMessage = (period: RecruitmentPeriod) => {
    const startDate = new Date(period.start_date);
    const endDate = new Date(period.end_date);
    
    if (startDate.getDay() !== 1) {
      return 'Debe iniciar en lunes';
    }
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays !== 6) {
      return 'Debe ser exactamente 7 días consecutivos';
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Períodos de Reclutamiento</h2>
          <p className="text-gray-600 mt-1">
            Gestiona los 4 períodos de 7 días para reclutar pacientes quirúrgicos
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Período
        </Button>
      </div>

      {/* Restricciones */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Restricciones Importantes</h3>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Cada período debe iniciar en lunes</li>
                <li>• Cada período debe durar exactamente 7 días consecutivos</li>
                <li>• Debe haber un mínimo de 4 meses entre períodos</li>
                <li>• Los períodos no pueden superponerse</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Períodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {periods.map((period) => {
          const daysUntil = getDaysUntilStart(period.start_date);
          const isValid = isPeriodValid(period);
          const validationMessage = getValidationMessage(period);

          return (
            <Card key={period.id} className={!isValid ? 'border-red-200' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Período {period.period_number}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(period.status)}
                    <Badge className={getStatusColor(period.status)}>
                      {getStatusLabel(period.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fechas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Inicio:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(period.start_date).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Fin:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(period.end_date).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                {/* Validación */}
                {!isValid && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800 font-medium">
                        {validationMessage}
                      </span>
                    </div>
                  </div>
                )}

                {/* Días hasta inicio */}
                {period.status === 'planned' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {daysUntil === 0 ? 'Inicia hoy' :
                         daysUntil === 1 ? 'Inicia mañana' :
                         daysUntil > 0 ? `Inicia en ${daysUntil} días` :
                         'Ya inició'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notas */}
                {period.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{period.notes}</span>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center space-x-2 pt-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  {period.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Validación de intervalos */}
      {periods.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Validación de Intervalos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {periods
                .sort((a, b) => a.period_number - b.period_number)
                .map((period, index) => {
                  if (index === 0) return null;
                  
                  const prevPeriod = periods.find(p => p.period_number === period.period_number - 1);
                  if (!prevPeriod) return null;
                  
                  const prevEnd = new Date(prevPeriod.end_date);
                  const currentStart = new Date(period.start_date);
                  const diffTime = currentStart.getTime() - prevEnd.getTime();
                  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
                  
                  const isValidInterval = diffMonths >= 4;
                  
                  return (
                    <div key={period.id} className={`p-3 rounded-lg ${
                      isValidInterval ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        {isValidInterval ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          isValidInterval ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Período {prevPeriod.period_number} → Período {period.period_number}: {diffMonths} meses
                          {isValidInterval ? ' ✓' : ' (mínimo 4 meses requerido)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado general */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Períodos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{periods.length}</div>
              <div className="text-sm text-gray-600">Total Períodos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {periods.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {periods.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {periods.filter(p => p.status === 'planned').length}
              </div>
              <div className="text-sm text-gray-600">Planificados</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
