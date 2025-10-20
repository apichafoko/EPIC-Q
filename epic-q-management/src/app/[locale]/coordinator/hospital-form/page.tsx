'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useProject } from '@/contexts/project-context';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from 'sonner';

export default function HospitalFormPage() {
  const { user } = useAuth();
  const { currentProject, loadProjects } = useProject();
  const { t } = useTranslations();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [pendingFields, setPendingFields] = useState<string[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // Estados de carga usando el hook personalizado
  const { isLoading, executeWithLoading: executeWithLoading } = useLoadingState();
  const { isLoading: isSaving, executeWithLoading: executeWithSaving } = useLoadingState();
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    province: "",
    city: "",
    participatedLasos: false,
    isLocationEditable: true, // Por defecto editable hasta que se carguen los datos
    
    // Structural Data
    numBeds: "",
    numOperatingRooms: "",
    numIcuBeds: "",
    avgWeeklySurgeries: "",
    hasResidencyProgram: false,
    hasPreopClinic: "",
    hasRapidResponseTeam: false,
    financingType: "",
    hasEthicsCommittee: false,
    universityAffiliated: false,
    notes: "",
    
    // Primary Coordinator
    coordinatorFirstName: "",
    coordinatorLastName: "",
    coordinatorEmail: "",
    coordinatorPhone: "",
    coordinatorPosition: ""
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  // Debug: Log formData changes
  console.log('🔄 Render - formData.name:', formData.name);
  console.log('🔄 Render - currentProject:', currentProject?.coordinatorInfo?.hospital?.name);

  // Load hospital data from current project
  useEffect(() => {
    console.log('🔄 useEffect ejecutándose, currentProject:', currentProject);
    console.log('🔄 currentProject?.coordinatorInfo:', currentProject?.coordinatorInfo);
    console.log('🔄 currentProject?.coordinatorInfo?.hospital:', currentProject?.coordinatorInfo?.hospital);
    
    if (!currentProject?.coordinatorInfo?.hospital) {
      console.log('❌ No hay hospital en currentProject');
      return;
    }
    
    console.log('✅ Hospital encontrado:', currentProject.coordinatorInfo.hospital);
    console.log('✅ Hospital name:', currentProject.coordinatorInfo.hospital.name);
    
    if (!currentProject.coordinatorInfo.hospital.hospital_details) {
      console.log('⚠️ No hay hospital_details, pero continuando con datos básicos');
    }
    
    const hospital = currentProject.coordinatorInfo.hospital;
    setHospitalData(hospital);
    
    // Determinar si los campos de provincia y ciudad deben ser editables
    const hasLocationData = hospital.province && hospital.city;
    
    // Obtener datos estructurales del hospital
    const hospitalDetails = hospital.hospital_details;
    const coordinatorContact = hospital.hospital_contacts?.[0]; // Primer contacto coordinador principal
    
    console.log('🔄 Precargando datos del formulario:', {
      hospital: hospital,
      hospitalName: hospital.name,
      hospitalDetails: hospitalDetails,
      coordinatorContact: coordinatorContact,
      financingType: hospitalDetails?.financing_type,
      hasPreopClinic: hospitalDetails?.has_preop_clinic
    });
    
    // Usar un setTimeout para asegurar que el estado se actualice correctamente
    setTimeout(() => {
      setFormData(prev => {
        const newFormData = {
          ...prev,
          // Datos básicos
          name: hospital.name || "",
          province: hospital.province || "",
          city: hospital.city || "",
          participatedLasos: hospital.lasos_participation || false,
          // Marcar si los campos de ubicación son editables
          isLocationEditable: !hasLocationData,
          
          // Datos estructurales
          numBeds: hospitalDetails?.num_beds?.toString() || "",
          numOperatingRooms: hospitalDetails?.num_operating_rooms?.toString() || "",
          numIcuBeds: hospitalDetails?.num_icu_beds?.toString() || "",
          avgWeeklySurgeries: hospitalDetails?.avg_weekly_surgeries?.toString() || "",
          financingType: hospitalDetails?.financing_type || "",
          hasPreopClinic: hospitalDetails?.has_preop_clinic || "",
          
          // Características del hospital (checkboxes)
          hasResidencyProgram: hospitalDetails?.has_residency_program || false,
          hasEthicsCommittee: hospitalDetails?.has_ethics_committee || false,
          hasRapidResponseTeam: hospitalDetails?.has_rapid_response_team || false,
          universityAffiliated: hospitalDetails?.university_affiliated || false,
          
          // Notas adicionales
          notes: hospitalDetails?.notes || "",
          
          // Datos del coordinador
          coordinatorFirstName: coordinatorContact?.name?.split(' ')[0] || "",
          coordinatorLastName: coordinatorContact?.name?.split(' ').slice(1).join(' ') || "",
          coordinatorEmail: coordinatorContact?.email || "",
          coordinatorPhone: coordinatorContact?.phone || "",
          coordinatorPosition: coordinatorContact?.specialty || ""
        };
        
        console.log('✅ FormData actualizado:', {
          name: newFormData.name,
          province: newFormData.province,
          city: newFormData.city,
          financingType: newFormData.financingType,
          hasPreopClinic: newFormData.hasPreopClinic
        });
        
        return newFormData;
      });
    }, 100);
  }, [currentProject, loadProjects]);

  // Precargar información del coordinador desde el usuario actual
  useEffect(() => {
    if (!user) return;
    
    // Separar el nombre completo en nombre y apellido
    const fullName = user.name || "";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    
    setFormData(prev => ({
      ...prev,
      coordinatorFirstName: firstName,
      coordinatorLastName: lastName,
      coordinatorEmail: user.email || ""
    }));
  }, [user]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar el campo de la lista de pendientes si se está modificando
    if (pendingFields.includes(field)) {
      setPendingFields(prev => prev.filter(f => f !== field));
    }
  };

  // Función para validar números entre 0 y 1000
  const validateNumericInput = (value: string): boolean => {
    if (value === '') return true; // Permitir campo vacío temporalmente
    const num = parseInt(value);
    return !isNaN(num) && num >= 0 && num <= 1000;
  };

  // Función para manejar cambios en campos numéricos
  const handleNumericChange = (field: string, value: string) => {
    if (value === '' || validateNumericInput(value)) {
      handleInputChange(field, value);
    }
  };

  // Función para validar que los campos numéricos estén completos y sean válidos
  const validateNumericFields = (): boolean => {
    const numericFields = ['numBeds', 'numOperatingRooms', 'numIcuBeds', 'avgWeeklySurgeries'];
    return numericFields.every(field => {
      const value = formData[field as keyof typeof formData];
      return value !== '' && validateNumericInput(value.toString());
    });
  };

  // Función para validar el paso 1 (Información Básica)
  const validateStep1 = (): { isValid: boolean; pendingFields: string[] } => {
    const pending: string[] = [];
    
    // Solo validar campos de ubicación si son editables
    if (formData.isLocationEditable) {
      if (!formData.province.trim()) pending.push('province');
      if (!formData.city.trim()) pending.push('city');
    }

    return {
      isValid: pending.length === 0,
      pendingFields: pending
    };
  };

  // Función para validar el paso 2 (Datos Estructurales)
  const validateStep2 = (): { isValid: boolean; pendingFields: string[] } => {
    const pending: string[] = [];
    
    // Validar campos numéricos
    const numericFields = ['numBeds', 'numOperatingRooms', 'numIcuBeds', 'avgWeeklySurgeries'];
    numericFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (value === '' || !validateNumericInput(value.toString())) {
        pending.push(field);
      }
    });

    // Validar campos de selección
    if (!formData.financingType) pending.push('financingType');
    if (!formData.hasPreopClinic) pending.push('hasPreopClinic');

    return {
      isValid: pending.length === 0,
      pendingFields: pending
    };
  };

  // Función para validar el paso 3 (Coordinador Principal)
  const validateStep3 = (): { isValid: boolean; pendingFields: string[] } => {
    const pending: string[] = [];
    
    if (!formData.coordinatorFirstName.trim()) pending.push('coordinatorFirstName');
    if (!formData.coordinatorLastName.trim()) pending.push('coordinatorLastName');
    if (!formData.coordinatorEmail.trim()) pending.push('coordinatorEmail');
    if (!formData.coordinatorPhone.trim()) pending.push('coordinatorPhone'); // Ahora es obligatorio
    if (!formData.coordinatorPosition.trim()) pending.push('coordinatorPosition');

    return {
      isValid: pending.length === 0,
      pendingFields: pending
    };
  };

  const handleSave = async () => {
    if (!currentProject?.coordinatorInfo?.hospital?.id) {
      console.error('No hospital ID available');
      return;
    }

    console.log('Saving form data:', {
      hospitalId: currentProject.coordinatorInfo.hospital.id,
      formData: formData
    });

    await executeWithSaving(async () => {
      const response = await fetch(`/api/hospitals/${currentProject.coordinatorInfo.hospital.id}/form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsSaved(true);
        setShowSuccessToast(true);
        toast.success('Formulario guardado exitosamente');
        
        // Recargar datos del proyecto para actualizar la información del hospital
        await loadProjects();
        
        setTimeout(() => {
          setIsSaved(false);
          setShowSuccessToast(false);
        }, 3000);
      } else {
        console.error('Error saving form:', data.error);
        toast.error('Error al guardar el formulario: ' + (data.error || 'Error desconocido'));
      }
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      let validation: { isValid: boolean; pendingFields: string[] } = { isValid: true, pendingFields: [] };
      
      // Validar según el paso actual
      if (currentStep === 1) {
        validation = validateStep1();
      } else if (currentStep === 2) {
        validation = validateStep2();
      } else if (currentStep === 3) {
        validation = validateStep3();
      }

      if (!validation.isValid) {
        setPendingFields(validation.pendingFields);
        // Scroll al primer campo pendiente
        setTimeout(() => {
          const firstPendingField = document.getElementById(validation.pendingFields[0]);
          if (firstPendingField) {
            firstPendingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstPendingField.focus();
          }
        }, 100);
        return;
      }

      // Limpiar campos pendientes si la validación es exitosa
      setPendingFields([]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    // Validar el paso actual antes de finalizar
    let validation: { isValid: boolean; pendingFields: string[] } = { isValid: true, pendingFields: [] };
    
    if (currentStep === 1) {
      validation = validateStep1();
    } else if (currentStep === 2) {
      validation = validateStep2();
    } else if (currentStep === 3) {
      validation = validateStep3();
    }

    if (!validation.isValid) {
      setPendingFields(validation.pendingFields);
      // Scroll al primer campo pendiente
      setTimeout(() => {
        const firstPendingField = document.getElementById(validation.pendingFields[0]);
        if (firstPendingField) {
          firstPendingField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstPendingField.focus();
        }
      }, 100);
      return;
    }

    // Si la validación es exitosa, proceder con el guardado
    setPendingFields([]);
    
    if (!currentProject?.coordinatorInfo?.hospital?.id) {
      console.error('No hospital ID available');
      return;
    }

    console.log('Finishing form with data:', {
      hospitalId: currentProject.coordinatorInfo.hospital.id,
      formData: formData
    });

    await executeWithSaving(async () => {
      const response = await fetch(`/api/hospitals/${currentProject.coordinatorInfo.hospital.id}/form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowSuccessToast(true);
        toast.success('Formulario completado exitosamente');
        
        // Recargar datos del proyecto para actualizar la información del hospital
        await loadProjects();
        
        // Redirigir después de mostrar el toast de éxito
        setTimeout(() => {
          router.push('/es/coordinator');
        }, 2000);
      } else {
        console.error('Error saving form:', data.error);
        toast.error('Error al guardar el formulario: ' + (data.error || 'Error desconocido'));
      }
    });
  };

  // Función auxiliar para determinar si un campo está pendiente
  const isFieldPending = (fieldName: string): boolean => {
    return pendingFields.includes(fieldName);
  };

  // Función auxiliar para obtener clases CSS de un campo
  const getFieldClasses = (fieldName: string, baseClasses: string = ""): string => {
    const pendingClasses = isFieldPending(fieldName) 
      ? "border-red-500 bg-red-50 ring-2 ring-red-200" 
      : "";
    return `${baseClasses} ${pendingClasses}`.trim();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Básica del Hospital</h3>
        <p className="text-sm text-gray-600 mb-6">
          Completa la información básica de tu hospital. El nombre fue proporcionado por el administrador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="name">Nombre del Hospital</Label>
          <Input
            id="name"
            value={formData.name}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">Este campo fue proporcionado por el administrador</p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="province" className={isFieldPending('province') ? 'text-red-600 font-medium' : ''}>
            Provincia {isFieldPending('province') && <span className="text-red-500">*</span>}
          </Label>
          {formData.isLocationEditable ? (
            <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
              <SelectTrigger className={getFieldClasses('province')}>
                <SelectValue placeholder="Seleccionar provincia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buenos Aires">Buenos Aires</SelectItem>
                <SelectItem value="CABA">Ciudad Autónoma de Buenos Aires</SelectItem>
                <SelectItem value="Catamarca">Catamarca</SelectItem>
                <SelectItem value="Chaco">Chaco</SelectItem>
                <SelectItem value="Chubut">Chubut</SelectItem>
                <SelectItem value="Córdoba">Córdoba</SelectItem>
                <SelectItem value="Corrientes">Corrientes</SelectItem>
                <SelectItem value="Entre Ríos">Entre Ríos</SelectItem>
                <SelectItem value="Formosa">Formosa</SelectItem>
                <SelectItem value="Jujuy">Jujuy</SelectItem>
                <SelectItem value="La Pampa">La Pampa</SelectItem>
                <SelectItem value="La Rioja">La Rioja</SelectItem>
                <SelectItem value="Mendoza">Mendoza</SelectItem>
                <SelectItem value="Misiones">Misiones</SelectItem>
                <SelectItem value="Neuquén">Neuquén</SelectItem>
                <SelectItem value="Río Negro">Río Negro</SelectItem>
                <SelectItem value="Salta">Salta</SelectItem>
                <SelectItem value="San Juan">San Juan</SelectItem>
                <SelectItem value="San Luis">San Luis</SelectItem>
                <SelectItem value="Santa Cruz">Santa Cruz</SelectItem>
                <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                <SelectItem value="Santiago del Estero">Santiago del Estero</SelectItem>
                <SelectItem value="Tierra del Fuego">Tierra del Fuego</SelectItem>
                <SelectItem value="Tucumán">Tucumán</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="province"
              value={formData.province}
              disabled
              className="bg-gray-50"
            />
          )}
          {isFieldPending('province') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
          {!formData.isLocationEditable && (
            <p className="text-xs text-gray-500">Esta información ya está cargada en el sistema</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="city" className={isFieldPending('city') ? 'text-red-600 font-medium' : ''}>
            Ciudad {isFieldPending('city') && <span className="text-red-500">*</span>}
          </Label>
          {formData.isLocationEditable ? (
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Ej: Buenos Aires, Córdoba, Rosario..."
              className={getFieldClasses('city')}
            />
          ) : (
            <Input
              id="city"
              value={formData.city}
              disabled
              className="bg-gray-50"
            />
          )}
          {isFieldPending('city') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
          {!formData.isLocationEditable && (
            <p className="text-xs text-gray-500">Esta información ya está cargada en el sistema</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="participatedLasos">¿Participó el hospital en el estudio LASOS?</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="participatedLasos"
              checked={formData.participatedLasos}
              onCheckedChange={(checked) => handleInputChange('participatedLasos', checked)}
            />
            <Label htmlFor="participatedLasos" className="text-sm font-normal">
              Sí, este hospital participó en el estudio LASOS
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Datos Estructurales</h3>
        <p className="text-sm text-gray-600 mb-6">
          Proporciona información detallada sobre la estructura y capacidades de tu hospital.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="numBeds" className={isFieldPending('numBeds') ? 'text-red-600 font-medium' : ''}>
            Número de Camas {isFieldPending('numBeds') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="numBeds"
            type="text"
            value={formData.numBeds}
            onChange={(e) => handleNumericChange('numBeds', e.target.value)}
            placeholder="Ej: 200"
            className={getFieldClasses('numBeds', formData.numBeds && !validateNumericInput(formData.numBeds.toString()) ? 'border-red-500' : '')}
          />
          {formData.numBeds && !validateNumericInput(formData.numBeds.toString()) && (
            <p className="text-sm text-red-500">Debe ser un número entre 0 y 1000</p>
          )}
          {isFieldPending('numBeds') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="numOperatingRooms" className={isFieldPending('numOperatingRooms') ? 'text-red-600 font-medium' : ''}>
            Quirófanos {isFieldPending('numOperatingRooms') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="numOperatingRooms"
            type="text"
            value={formData.numOperatingRooms}
            onChange={(e) => handleNumericChange('numOperatingRooms', e.target.value)}
            placeholder="Ej: 8"
            className={getFieldClasses('numOperatingRooms', formData.numOperatingRooms && !validateNumericInput(formData.numOperatingRooms.toString()) ? 'border-red-500' : '')}
          />
          {formData.numOperatingRooms && !validateNumericInput(formData.numOperatingRooms.toString()) && (
            <p className="text-sm text-red-500">Debe ser un número entre 0 y 1000</p>
          )}
          {isFieldPending('numOperatingRooms') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="numIcuBeds" className={isFieldPending('numIcuBeds') ? 'text-red-600 font-medium' : ''}>
            Camas de UCI {isFieldPending('numIcuBeds') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="numIcuBeds"
            type="text"
            value={formData.numIcuBeds}
            onChange={(e) => handleNumericChange('numIcuBeds', e.target.value)}
            placeholder="Ej: 20"
            className={getFieldClasses('numIcuBeds', formData.numIcuBeds && !validateNumericInput(formData.numIcuBeds.toString()) ? 'border-red-500' : '')}
          />
          {formData.numIcuBeds && !validateNumericInput(formData.numIcuBeds.toString()) && (
            <p className="text-sm text-red-500">Debe ser un número entre 0 y 1000</p>
          )}
          {isFieldPending('numIcuBeds') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="avgWeeklySurgeries" className={isFieldPending('avgWeeklySurgeries') ? 'text-red-600 font-medium' : ''}>
            Cirugías Semanales Promedio {isFieldPending('avgWeeklySurgeries') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="avgWeeklySurgeries"
            type="text"
            value={formData.avgWeeklySurgeries}
            onChange={(e) => handleNumericChange('avgWeeklySurgeries', e.target.value)}
            placeholder="Ej: 50"
            className={getFieldClasses('avgWeeklySurgeries', formData.avgWeeklySurgeries && !validateNumericInput(formData.avgWeeklySurgeries.toString()) ? 'border-red-500' : '')}
          />
          {formData.avgWeeklySurgeries && !validateNumericInput(formData.avgWeeklySurgeries.toString()) && (
            <p className="text-sm text-red-500">Debe ser un número entre 0 y 1000</p>
          )}
          {isFieldPending('avgWeeklySurgeries') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="financingType" className={isFieldPending('financingType') ? 'text-red-600 font-medium' : ''}>
            Tipo de Financiamiento {isFieldPending('financingType') && <span className="text-red-500">*</span>}
          </Label>
          <Select value={formData.financingType} onValueChange={(value) => handleInputChange('financingType', value)}>
            <SelectTrigger className={getFieldClasses('financingType')}>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Público">Público</SelectItem>
              <SelectItem value="Privado">Privado</SelectItem>
              <SelectItem value="Mixto">Mixto</SelectItem>
            </SelectContent>
          </Select>
          {isFieldPending('financingType') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="hasPreopClinic" className={isFieldPending('hasPreopClinic') ? 'text-red-600 font-medium' : ''}>
            Clínica Preoperatoria {isFieldPending('hasPreopClinic') && <span className="text-red-500">*</span>}
          </Label>
          <Select value={formData.hasPreopClinic} onValueChange={(value) => handleInputChange('hasPreopClinic', value)}>
            <SelectTrigger className={getFieldClasses('hasPreopClinic')}>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sí">Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Parcial">Parcial</SelectItem>
            </SelectContent>
          </Select>
          {isFieldPending('hasPreopClinic') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Características del Hospital</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasResidencyProgram"
              checked={formData.hasResidencyProgram}
              onCheckedChange={(checked) => handleInputChange('hasResidencyProgram', checked)}
            />
            <Label htmlFor="hasResidencyProgram">Programa de Residencia</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasRapidResponseTeam"
              checked={formData.hasRapidResponseTeam}
              onCheckedChange={(checked) => handleInputChange('hasRapidResponseTeam', checked)}
            />
            <Label htmlFor="hasRapidResponseTeam">Equipo de Respuesta Rápida</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasEthicsCommittee"
              checked={formData.hasEthicsCommittee}
              onCheckedChange={(checked) => handleInputChange('hasEthicsCommittee', checked)}
            />
            <Label htmlFor="hasEthicsCommittee">Comité de Ética</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="universityAffiliated"
              checked={formData.universityAffiliated}
              onCheckedChange={(checked) => handleInputChange('universityAffiliated', checked)}
            />
            <Label htmlFor="universityAffiliated">Afiliado a Universidad</Label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Información adicional sobre el hospital..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Coordinador Principal</h3>
        <p className="text-sm text-gray-600 mb-6">
          Información del coordinador principal del estudio en este hospital.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Label htmlFor="coordinatorFirstName" className={isFieldPending('coordinatorFirstName') ? 'text-red-600 font-medium' : ''}>
            Nombre {isFieldPending('coordinatorFirstName') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="coordinatorFirstName"
            value={formData.coordinatorFirstName}
            onChange={(e) => handleInputChange('coordinatorFirstName', e.target.value)}
            placeholder="Ej: Juan"
            className={getFieldClasses('coordinatorFirstName')}
          />
          {isFieldPending('coordinatorFirstName') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="coordinatorLastName" className={isFieldPending('coordinatorLastName') ? 'text-red-600 font-medium' : ''}>
            Apellido {isFieldPending('coordinatorLastName') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="coordinatorLastName"
            value={formData.coordinatorLastName}
            onChange={(e) => handleInputChange('coordinatorLastName', e.target.value)}
            placeholder="Ej: Pérez"
            className={getFieldClasses('coordinatorLastName')}
          />
          {isFieldPending('coordinatorLastName') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="coordinatorEmail" className={isFieldPending('coordinatorEmail') ? 'text-red-600 font-medium' : ''}>
            Correo Electrónico {isFieldPending('coordinatorEmail') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="coordinatorEmail"
            type="email"
            value={formData.coordinatorEmail}
            onChange={(e) => handleInputChange('coordinatorEmail', e.target.value)}
            placeholder="coordinador@hospital.com"
            className={getFieldClasses('coordinatorEmail')}
          />
          {isFieldPending('coordinatorEmail') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="coordinatorPhone" className={isFieldPending('coordinatorPhone') ? 'text-red-600 font-medium' : ''}>
            Teléfono <span className="text-red-500">*</span>
          </Label>
          <Input
            id="coordinatorPhone"
            value={formData.coordinatorPhone}
            onChange={(e) => handleInputChange('coordinatorPhone', e.target.value)}
            placeholder="+54 11 1234-5678"
            className={getFieldClasses('coordinatorPhone')}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="coordinatorPosition" className={isFieldPending('coordinatorPosition') ? 'text-red-600 font-medium' : ''}>
            Cargo {isFieldPending('coordinatorPosition') && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="coordinatorPosition"
            value={formData.coordinatorPosition}
            onChange={(e) => handleInputChange('coordinatorPosition', e.target.value)}
            placeholder="Ej: Jefe de Cirugía"
            className={getFieldClasses('coordinatorPosition')}
          />
          {isFieldPending('coordinatorPosition') && (
            <p className="text-sm text-red-500">Este campo es requerido</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('coordinator.hospitalForm')}</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Completa la información detallada de tu hospital para el estudio EPIC-Q
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Paso {currentStep} de {totalSteps}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Información Básica</span>
              <span>Datos Estructurales</span>
              <span>Coordinador</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && "Información Básica"}
            {currentStep === 2 && "Datos Estructurales"}
            {currentStep === 3 && "Coordinador Principal"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Información general del hospital"}
            {currentStep === 2 && "Capacidades y características estructurales"}
            {currentStep === 3 && "Datos del coordinador principal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-0">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="w-full md:w-auto touch-target"
        >
          Anterior
        </Button>

        <div className="flex flex-col md:flex-row gap-3 md:gap-2">
          <LoadingButton
            variant="outline"
            onClick={handleSave}
            loading={isSaving}
            loadingText="Guardando..."
            className="w-full md:w-auto touch-target"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Borrador
          </LoadingButton>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext} className="w-full md:w-auto touch-target">
              Siguiente
            </Button>
          ) : (
            <LoadingButton 
              onClick={handleFinish} 
              loading={isSaving} 
              loadingText="Finalizando..."
              className="w-full md:w-auto touch-target"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar
            </LoadingButton>
          )}
        </div>
      </div>

      {/* Save Status */}
      {isSaved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Formulario guardado exitosamente
          </AlertDescription>
        </Alert>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="font-medium">
              ¡Formulario completado exitosamente! Redirigiendo...
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
