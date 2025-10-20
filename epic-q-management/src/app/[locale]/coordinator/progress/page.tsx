'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useProject } from '@/contexts/project-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Edit,
  Save,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from 'sonner';

export default function CoordinatorProgressPage() {
  const { t } = useTranslations();
  const { currentProject } = useProject();
  const [progressData, setProgressData] = useState({
    ethicsSubmitted: false,
    ethicsSubmittedDate: null as Date | null,
    ethicsApproved: false,
    ethicsApprovedDate: null as Date | null,
    ethicsDocument: null as File | null,
    recruitmentStartDate: null as Date | null,
    recruitmentEndDate: null as Date | null,
    recruitmentPeriods: [] as Array<{
      id: string;
      periodNumber: number;
      startDate: Date;
      endDate: Date;
      status: 'planned' | 'active' | 'completed';
    }>
  });
  const [hospitalInfo, setHospitalInfo] = useState({
    requiredPeriods: 2
  });

  const [showCalendar, setShowCalendar] = useState<'ethicsSubmitted' | 'ethicsApproved' | 'recruitmentStart' | 'recruitmentEnd' | 'editStart' | 'editEnd' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<{
    id: string;
    periodNumber: number;
    startDate: Date;
    endDate: Date;
    status: 'planned' | 'active' | 'completed';
  } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirmToast, setShowDeleteConfirmToast] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Estados de carga usando el hook personalizado
  const { isLoading, executeWithLoading: executeWithLoading } = useLoadingState();
  const { isLoading: isSavingEthics, executeWithLoading: executeWithSavingEthics } = useLoadingState();
  const { isLoading: isSavingPeriod, executeWithLoading: executeWithSavingPeriod } = useLoadingState();
  const { isLoading: isDeletingPeriod, executeWithLoading: executeWithDeletingPeriod } = useLoadingState();

  // Cargar períodos de reclutamiento y información de ética al montar el componente
  useEffect(() => {
    const loadAllData = async () => {
      setIsInitialLoading(true);
      try {
        await Promise.all([
          loadRecruitmentPeriods(),
          loadEthicsInformation(),
          loadHospitalInfo()
        ]);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadAllData();
  }, []);

  const loadRecruitmentPeriods = async () => {
    try {
      if (!currentProject?.id) {
        console.error('No current project available');
        return;
      }

      const response = await fetch(`/api/coordinator/recruitment-periods?projectId=${currentProject.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProgressData(prev => ({
            ...prev,
            recruitmentPeriods: data.periods.map((period: any) => ({
              id: period.id,
              periodNumber: period.periodNumber,
              startDate: new Date(period.startDate),
              endDate: new Date(period.endDate),
              status: period.status
            }))
          }));
        }
      }
    } catch (error) {
      console.error('Error loading recruitment periods:', error);
    }
  };

  const loadEthicsInformation = async () => {
    if (!currentProject?.id) {
      console.log('No current project available for loading ethics information');
      return;
    }

    try {
      const response = await fetch(`/api/coordinator/stats?projectId=${currentProject.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.hospital && data.data.hospital.progress) {
          const progress = data.data.hospital.progress;
          setProgressData(prev => ({
            ...prev,
            ethicsSubmitted: progress.ethics_submitted || false,
            ethicsApproved: progress.ethics_approved || false,
            ethicsSubmittedDate: progress.ethics_submitted_date ? new Date(progress.ethics_submitted_date) : null,
            ethicsApprovedDate: progress.ethics_approved_date ? new Date(progress.ethics_approved_date) : null,
          }));
        }
      } else {
        console.error('Error loading ethics information:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading ethics information:', error);
    }
  };

  const loadHospitalInfo = async () => {
    if (!currentProject?.id) {
      console.log('No current project available for loading hospital info');
      return;
    }

    try {
      const response = await fetch(`/api/coordinator/stats?projectId=${currentProject.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.hospital) {
          setHospitalInfo({
            requiredPeriods: data.data.hospital.required_periods || 2
          });
        }
      } else {
        console.error('Error loading hospital info:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading hospital info:', error);
    }
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setProgressData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleDateChange = (field: string, date: Date | undefined) => {
    if (date) {
      // Validar fechas de ética (no pueden ser futuras)
      if (field === 'ethicsSubmittedDate' || field === 'ethicsApprovedDate') {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
        
        if (date > today) {
          showError('Las fechas de ética no pueden ser futuras');
          setShowCalendar(null);
          return;
        }
      }

      if (field === 'editStart' || field === 'editEnd') {
        // Manejar fechas del modal de edición
        if (editingPeriod) {
          setEditingPeriod(prev => ({
            ...prev!,
            [field === 'editStart' ? 'startDate' : 'endDate']: date
          }));
        }
      } else {
        // Manejar fechas del formulario principal
        setProgressData(prev => {
          const newData = {
            ...prev,
            [field]: date
          };

          // Si se selecciona fecha de inicio de reclutamiento, 
          // limpiar fecha de fin para forzar nueva selección
          if (field === 'recruitmentStartDate') {
            newData.recruitmentEndDate = null;
          }

          return newData;
        });
      }
    }
    setShowCalendar(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setProgressData(prev => ({
        ...prev,
        ethicsDocument: file
      }));
    }
  };

  const addRecruitmentPeriod = async () => {
    if (!progressData.recruitmentStartDate || !progressData.recruitmentEndDate) {
      return;
    }

    // Validar fechas del lado del cliente
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (progressData.recruitmentStartDate < today) {
      showError('La fecha de inicio no puede ser menor a la fecha actual');
      return;
    }

    if (progressData.recruitmentEndDate <= progressData.recruitmentStartDate) {
      showError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    await executeWithSavingPeriod(async () => {
      if (!currentProject?.id) {
        showError('No hay proyecto seleccionado');
        return;
      }

      const response = await fetch(`/api/coordinator/recruitment-periods?projectId=${currentProject.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: progressData.recruitmentStartDate.toISOString(),
          endDate: progressData.recruitmentEndDate.toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Recargar períodos desde la base de datos
        await loadRecruitmentPeriods();
        
        // Limpiar fechas
        setProgressData(prev => ({
          ...prev,
          recruitmentStartDate: null,
          recruitmentEndDate: null
        }));

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        console.error('Error creating period:', data.error);
        showError('Error al crear el período: ' + (data.error || 'Error desconocido'));
      }
    });
  };

  const handleEditPeriod = (period: any) => {
    setEditingPeriod(period);
    setShowEditModal(true);
  };

  const handleUpdatePeriod = async () => {
    if (!editingPeriod) return;

    // Validar fechas del lado del cliente
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (editingPeriod.startDate < today) {
      showError('La fecha de inicio no puede ser menor a la fecha actual');
      return;
    }

    if (editingPeriod.endDate <= editingPeriod.startDate) {
      showError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    await executeWithSavingPeriod(async () => {
      const response = await fetch(`/api/coordinator/recruitment-periods/${editingPeriod.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: editingPeriod.startDate.toISOString(),
          endDate: editingPeriod.endDate.toISOString()
          // El estado se calcula automáticamente en el servidor
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Recargar períodos desde la base de datos
        await loadRecruitmentPeriods();
        setShowEditModal(false);
        setEditingPeriod(null);
        setShowSuccessToast(true);
        toast.success('Período actualizado exitosamente');
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        console.error('Error updating period:', data.error);
        toast.error('Error al actualizar el período: ' + (data.error || 'Error desconocido'));
      }
    });
  };

  const handleDeletePeriod = (periodId: string) => {
    setPeriodToDelete(periodId);
    setShowDeleteConfirmToast(true);
  };

  const confirmDeletePeriod = async () => {
    if (!periodToDelete) return;
    
    await executeWithDeletingPeriod(async () => {
      const response = await fetch(`/api/coordinator/recruitment-periods/${periodToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadRecruitmentPeriods();
        setShowSuccessToast(true);
        toast.success('Período eliminado exitosamente');
        setTimeout(() => setShowSuccessToast(false), 3000);
      } else {
        console.error('Error deleting period:', data.error);
        toast.error('Error al eliminar el período: ' + (data.error || 'Error desconocido'));
      }
    });
    
    setShowDeleteConfirmToast(false);
    setPeriodToDelete(null);
  };

  const cancelDeletePeriod = () => {
    setShowDeleteConfirmToast(false);
    setPeriodToDelete(null);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
    setTimeout(() => setShowErrorToast(false), 5000);
  };

  const saveEthicsInformation = async () => {
    await executeWithSavingEthics(async () => {
      if (!currentProject?.id) {
        toast.error('No hay proyecto seleccionado');
        return;
      }

      const response = await fetch(`/api/coordinator/ethics?projectId=${currentProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-project-id': currentProject.id
        },
        credentials: 'include',
        body: JSON.stringify({
          ethicsSubmitted: progressData.ethicsSubmitted,
          ethicsApproved: progressData.ethicsApproved,
          ethicsSubmittedDate: progressData.ethicsSubmittedDate,
          ethicsApprovedDate: progressData.ethicsApprovedDate,
        }),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (response.ok && data.success) {
        setShowSuccessToast(true);
        toast.success('Información de ética guardada exitosamente');
        setTimeout(() => setShowSuccessToast(false), 3000);
        // Recargar la información de ética para mostrar los cambios
        await loadEthicsInformation();
      } else {
        console.error('Error saving ethics information:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          fullData: data
        });
        
        if (response.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          // Redirigir al login
          window.location.href = '/es/auth/login';
        } else {
          toast.error('Error al guardar la información de ética: ' + (data.error || 'Error desconocido'));
        }
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'planned':
        return <Badge className="bg-yellow-100 text-yellow-800">Planificado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  // Verificar si el formulario del hospital está completo
  const isHospitalFormComplete = currentProject?.coordinatorInfo?.hospital?.hospital_details && 
    currentProject.coordinatorInfo.hospital.hospital_details.num_beds &&
    currentProject.coordinatorInfo.hospital.hospital_details.num_operating_rooms &&
    currentProject.coordinatorInfo.hospital.hospital_details.num_icu_beds &&
    currentProject.coordinatorInfo.hospital.hospital_details.avg_weekly_surgeries &&
    currentProject.coordinatorInfo.hospital.hospital_details.financing_type &&
    currentProject.coordinatorInfo.hospital.hospital_details.has_preop_clinic &&
    currentProject.coordinatorInfo.hospital.lasos_participation !== null &&
    currentProject.coordinatorInfo.hospital.hospital_contacts?.[0]?.name &&
    currentProject.coordinatorInfo.hospital.hospital_contacts?.[0]?.email &&
    currentProject.coordinatorInfo.hospital.hospital_contacts?.[0]?.phone &&
    currentProject.coordinatorInfo.hospital.hospital_contacts?.[0]?.specialty;

  const overallProgressItems = [
    { label: 'Formulario del Hospital', completed: isHospitalFormComplete },
    { label: 'Ética Enviada', completed: progressData.ethicsSubmitted },
    { label: 'Ética Aprobada', completed: progressData.ethicsApproved },
    { label: 'Períodos de Reclutamiento', completed: progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2) }
  ];

  const completedCount = overallProgressItems.filter(item => item.completed).length;
  const progressPercentage = (completedCount / overallProgressItems.length) * 100;

  // Mostrar loading mientras se cargan los datos iniciales
  if (isInitialLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.progress')}</h1>
          <p className="text-gray-600 mt-2">
            Gestiona el progreso del estudio en tu hospital
          </p>
        </div>
        
        {/* Loading State */}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.progress')}</h1>
        <p className="text-gray-600 mt-2">
          Gestiona el progreso del estudio en tu hospital
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso General</CardTitle>
          <CardDescription>
            Estado actual del estudio en tu hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Progreso General</span>
              <span>{completedCount}/{overallProgressItems.length} ({Math.round(progressPercentage)}%)</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {overallProgressItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${item.completed ? 'text-green-700' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Section - Only show when hospital form is complete */}
      {isHospitalFormComplete && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <CheckCircle className="h-5 w-5" />
              <span>🎯 Próximos Pasos</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              ¡Excelente! Has completado el formulario del hospital. Ahora continúa con estas tareas importantes:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border-2 ${
                  progressData.ethicsApproved 
                    ? 'border-green-200 bg-green-50' 
                    : progressData.ethicsSubmitted 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      progressData.ethicsApproved 
                        ? 'bg-green-100 text-green-600' 
                        : progressData.ethicsSubmitted 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      1
                    </div>
                    <div>
                      <h4 className={`font-medium ${
                        progressData.ethicsApproved 
                          ? 'text-green-800' 
                          : progressData.ethicsSubmitted 
                            ? 'text-blue-800' 
                            : 'text-yellow-800'
                      }`}>
                        Comité de Ética
                      </h4>
                      <p className={`text-sm ${
                        progressData.ethicsApproved 
                          ? 'text-green-600' 
                          : progressData.ethicsSubmitted 
                            ? 'text-blue-600' 
                            : 'text-yellow-600'
                      }`}>
                        {progressData.ethicsApproved 
                          ? '✅ Aprobado por el comité' 
                          : progressData.ethicsSubmitted 
                            ? '⏳ Pendiente de aprobar' 
                            : '⚠️ Pendiente de presentar'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border-2 ${
                  progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2)
                    ? 'border-green-200 bg-green-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2)
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      2
                    </div>
                    <div>
                      <h4 className={`font-medium ${
                        progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2) ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        Períodos de Reclutamiento
                      </h4>
                      <p className={`text-sm ${
                        progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2) ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {progressData.recruitmentPeriods.length >= (hospitalInfo.requiredPeriods || 2)
                          ? `✅ ${progressData.recruitmentPeriods.length}/${hospitalInfo.requiredPeriods || 2} períodos completados` 
                          : `⚠️ ${progressData.recruitmentPeriods.length}/${hospitalInfo.requiredPeriods || 2} períodos configurados`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ethics Committee Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Comité de Ética</span>
          </CardTitle>
          <CardDescription>
            Gestiona la presentación y aprobación del comité de ética
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ethics Submitted */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ethicsSubmitted"
                checked={progressData.ethicsSubmitted}
                onCheckedChange={(checked) => handleCheckboxChange('ethicsSubmitted', checked as boolean)}
              />
              <Label htmlFor="ethicsSubmitted" className="text-base font-medium">
                Presentado al Comité de Ética
              </Label>
            </div>

            {progressData.ethicsSubmitted && (
              <div className="ml-6 space-y-3">
                <Label htmlFor="ethicsSubmittedDate">Fecha de Presentación</Label>
                <Popover open={showCalendar === 'ethicsSubmitted'} onOpenChange={() => setShowCalendar(showCalendar === 'ethicsSubmitted' ? null : 'ethicsSubmitted')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.ethicsSubmittedDate ? 
                        format(progressData.ethicsSubmittedDate, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.ethicsSubmittedDate || undefined}
                      onSelect={(date) => handleDateChange('ethicsSubmittedDate', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(23, 59, 59, 999);
                        return date > today;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Ethics Approved */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ethicsApproved"
                checked={progressData.ethicsApproved}
                onCheckedChange={(checked) => handleCheckboxChange('ethicsApproved', checked as boolean)}
                disabled={!progressData.ethicsSubmitted}
              />
              <Label htmlFor="ethicsApproved" className="text-base font-medium">
                Aprobado por el Comité de Ética
              </Label>
            </div>

            {progressData.ethicsApproved && (
              <div className="ml-6 space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="ethicsApprovedDate">Fecha de Aprobación</Label>
                  <Popover open={showCalendar === 'ethicsApproved'} onOpenChange={() => setShowCalendar(showCalendar === 'ethicsApproved' ? null : 'ethicsApproved')}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {progressData.ethicsApprovedDate ? 
                          format(progressData.ethicsApprovedDate, 'PPP', { locale: es }) : 
                          'Seleccionar fecha'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={progressData.ethicsApprovedDate || undefined}
                        onSelect={(date) => handleDateChange('ethicsApprovedDate', date)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(23, 59, 59, 999);
                          return date > today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="ethicsDocument">Documento de Aprobación (PDF)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="ethicsDocument"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('ethicsDocument')?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Subir PDF</span>
                    </Button>
                    {progressData.ethicsDocument && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{progressData.ethicsDocument.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Handle download */}}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <LoadingButton 
              onClick={saveEthicsInformation}
              loading={isSavingEthics}
              loadingText="Guardando..."
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Información de Ética</span>
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* Recruitment Periods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Períodos de Reclutamiento</span>
          </CardTitle>
          <CardDescription>
            Define los períodos de reclutamiento para tu hospital. 
            <span className="font-medium text-blue-600">
              Requeridos: {hospitalInfo.requiredPeriods} período{hospitalInfo.requiredPeriods !== 1 ? 's' : ''} 
              ({progressData.recruitmentPeriods.length}/{hospitalInfo.requiredPeriods} completados)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Period */}
          <div className="space-y-4">
            <h4 className="font-medium">Agregar Nuevo Período</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Fecha de Inicio</Label>
                <Popover open={showCalendar === 'recruitmentStart'} onOpenChange={() => setShowCalendar(showCalendar === 'recruitmentStart' ? null : 'recruitmentStart')}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.recruitmentStartDate ? 
                        format(progressData.recruitmentStartDate, 'PPP', { locale: es }) : 
                        'Seleccionar fecha'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.recruitmentStartDate || undefined}
                      onSelect={(date) => handleDateChange('recruitmentStartDate', date)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <Label>Fecha de Fin</Label>
                {progressData.recruitmentStartDate && (
                  <p className="text-sm text-gray-600">
                    Debe ser posterior al {format(progressData.recruitmentStartDate, 'PPP', { locale: es })}
                  </p>
                )}
                <Popover open={showCalendar === 'recruitmentEnd'} onOpenChange={() => setShowCalendar(showCalendar === 'recruitmentEnd' ? null : 'recruitmentEnd')}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                      disabled={!progressData.recruitmentStartDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {progressData.recruitmentEndDate ? 
                        format(progressData.recruitmentEndDate, 'PPP', { locale: es }) : 
                        progressData.recruitmentStartDate ? 'Seleccionar fecha' : 'Selecciona primero la fecha de inicio'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={progressData.recruitmentEndDate || undefined}
                      onSelect={(date) => handleDateChange('recruitmentEndDate', date)}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        const startDate = progressData.recruitmentStartDate;
                        // Deshabilitar fechas anteriores a hoy o anteriores/iguales a la fecha de inicio
                        return date < today || (startDate && date <= startDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              onClick={addRecruitmentPeriod}
              disabled={
                !progressData.recruitmentStartDate || 
                !progressData.recruitmentEndDate || 
                isSavingPeriod ||
                progressData.recruitmentPeriods.length >= hospitalInfo.requiredPeriods
              }
            >
              {isSavingPeriod ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : progressData.recruitmentPeriods.length >= hospitalInfo.requiredPeriods ? (
                `Límite alcanzado (${hospitalInfo.requiredPeriods} períodos)`
              ) : (
                'Agregar Período'
              )}
            </Button>
          </div>

          {/* Existing Periods */}
          {progressData.recruitmentPeriods.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Períodos Configurados</h4>
              <div className="space-y-2">
                {progressData.recruitmentPeriods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">
                          Período {period.periodNumber}: {format(period.startDate, 'dd/MM/yyyy', { locale: es })} - {format(period.endDate, 'dd/MM/yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24))} días
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(period.status)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditPeriod(period)}
                        disabled={isLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeletePeriod(period.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {progressData.recruitmentPeriods.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Debes configurar los períodos mínimos obligatorios para el estudio.
          </AlertDescription>
        </Alert>
      )}

        {/* Edit Period Modal */}
        <Modal open={showEditModal} onOpenChange={setShowEditModal}>
          <ModalContent className="sm:max-w-2xl">
          <ModalHeader>
            <ModalTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Editar Período</span>
            </ModalTitle>
            <ModalDescription>
              Modifica las fechas y estado del período de reclutamiento
            </ModalDescription>
          </ModalHeader>
          
          {editingPeriod && (
            <div className="space-y-6">
              {/* Period info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Editando:</span> Período {editingPeriod.periodNumber}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Fecha de Inicio</Label>
                  <Popover open={showCalendar === 'editStart'} onOpenChange={() => setShowCalendar(showCalendar === 'editStart' ? null : 'editStart')}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingPeriod.startDate ? 
                          format(editingPeriod.startDate, 'PPP', { locale: es }) : 
                          'Seleccionar fecha'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingPeriod.startDate}
                        onSelect={(date) => handleDateChange('editStart', date)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label>Fecha de Fin</Label>
                  <Popover open={showCalendar === 'editEnd'} onOpenChange={() => setShowCalendar(showCalendar === 'editEnd' ? null : 'editEnd')}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingPeriod.endDate ? 
                          format(editingPeriod.endDate, 'PPP', { locale: es }) : 
                          'Seleccionar fecha'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingPeriod.endDate}
                        onSelect={(date) => handleDateChange('editEnd', date)}
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0));
                          const startDate = editingPeriod.startDate;
                          return date < today || (startDate && date <= startDate);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Estado calculado automáticamente */}
              <div className="space-y-3">
                <Label>Estado</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    El estado se calcula automáticamente basado en las fechas:
                  </p>
                  <ul className="text-xs text-gray-500 mt-2 space-y-1">
                    <li>• <span className="font-medium">Planificado:</span> Aún no ha comenzado</li>
                    <li>• <span className="font-medium">En Progreso:</span> Está sucediendo actualmente</li>
                    <li>• <span className="font-medium">Completado:</span> Ya ha terminado</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <LoadingButton 
                  onClick={handleUpdatePeriod}
                  loading={isSavingPeriod}
                  loadingText="Guardando..."
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </LoadingButton>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50">
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="font-medium">
                ¡Operación completada exitosamente!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Toast */}
        {showErrorToast && (
          <div className="fixed top-4 right-4 z-50">
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="font-medium">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Delete Confirmation Toast */}
        {showDeleteConfirmToast && (
          <div className="fixed top-4 right-4 z-50">
            <Alert className="bg-red-50 border-red-200 text-red-800 max-w-md">
              <AlertDescription className="font-medium mb-3">
                ¿Estás seguro de que quieres eliminar este período?
              </AlertDescription>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={cancelDeletePeriod}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={confirmDeletePeriod}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </Button>
              </div>
            </Alert>
          </div>
        )}
    </div>
  );
}
