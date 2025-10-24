import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Calendar, Building, Users, Stethoscope } from 'lucide-react';
import { Hospital, HospitalDetails, Contact } from '@/types';

interface HospitalInfoTabProps {
  hospital: Hospital;
  details: HospitalDetails | undefined;
  contacts: Contact[];
}

export function HospitalInfoTab({ hospital, details, contacts }: HospitalInfoTabProps) {
  const coordinator = contacts.find(c => c.is_primary);
  const collaborators = contacts.filter(c => !c.is_primary);

  const getFinancingTypeLabel = (type?: string) => {
    switch (type) {
      case 'private': return 'Privado';
      case 'public': return 'Público';
      case 'social_security': return 'Obra Social';
      case 'other': return 'Otro';
      default: return 'No especificado';
    }
  };

  const getPreopClinicLabel = (clinic?: string) => {
    switch (clinic) {
      case 'always': return 'Siempre';
      case 'sometimes': return 'A veces';
      case 'never': return 'Nunca';
      default: return 'No especificado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {hospital.name}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{hospital.city}, {hospital.province}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Desde {new Date(hospital.created_at).toLocaleDateString('es-AR')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-800">
                {hospital.projects?.[0]?.redcap_id || 'Sin ID RedCap'}
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {hospital.participated_lasos ? 'Participó LASOS' : 'No participó LASOS'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Datos Estructurales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Datos Estructurales</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Tipo de Financiamiento</label>
              <p className="text-sm text-gray-900">{getFinancingTypeLabel(details?.financing_type)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Número de Camas</label>
              <p className="text-sm text-gray-900">{details?.num_beds || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Quirófanos</label>
              <p className="text-sm text-gray-900">{details?.num_operating_rooms || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Camas UTI</label>
              <p className="text-sm text-gray-900">{details?.num_icu_beds || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Cirugías Semanales Promedio</label>
              <p className="text-sm text-gray-900">{details?.avg_weekly_surgeries || 'No especificado'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Programa de Residencias</label>
              <p className="text-sm text-gray-900">
                {details?.has_residency_program !== undefined 
                  ? (details.has_residency_program ? 'Sí' : 'No')
                  : 'No especificado'
                }
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Consultorio Prequirúrgico</label>
              <p className="text-sm text-gray-900">{getPreopClinicLabel(details?.has_preop_clinic)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Equipo de Respuesta Rápida</label>
              <p className="text-sm text-gray-900">
                {details?.has_rapid_response_team !== undefined 
                  ? (details.has_rapid_response_team ? 'Sí' : 'No')
                  : 'No especificado'
                }
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Comité de Ética</label>
              <p className="text-sm text-gray-900">
                {details?.has_ethics_committee !== undefined 
                  ? (details.has_ethics_committee ? 'Sí' : 'No')
                  : 'No especificado'
                }
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Afiliación Universitaria</label>
              <p className="text-sm text-gray-900">
                {details?.university_affiliated !== undefined 
                  ? (details.university_affiliated ? 'Sí' : 'No')
                  : 'No especificado'
                }
              </p>
            </div>
          </div>
          {details?.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-600">Notas Adicionales</label>
              <p className="text-sm text-gray-900 mt-1">{details.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coordinador Principal */}
      {coordinator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Coordinador Principal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{coordinator.name}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{coordinator.email}</span>
                  </div>
                  {coordinator.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{coordinator.phone}</span>
                    </div>
                  )}
                  {coordinator.specialty && (
                    <div className="flex items-center space-x-1">
                      <Stethoscope className="h-4 w-4" />
                      <span>{coordinator.specialty}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                  {coordinator.phone && (
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Llamar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Colaboradores */}
      {collaborators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Colaboradores ({collaborators.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {collaborator.name}
                    </h4>
                    <div className="text-xs text-gray-500 truncate">
                      {collaborator.email}
                    </div>
                    {collaborator.specialty && (
                      <div className="text-xs text-gray-600 mt-1">
                        {collaborator.specialty}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
