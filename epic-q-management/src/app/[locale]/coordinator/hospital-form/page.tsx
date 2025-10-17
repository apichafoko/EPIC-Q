'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
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

export default function HospitalFormPage() {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    name: "Hospital General de Agudos Dr. Juan A. Fernández",
    province: "CABA",
    city: "Buenos Aires",
    
    // Structural Data
    numBeds: 0,
    numOperatingRooms: 0,
    numIcuBeds: 0,
    avgWeeklySurgeries: 0,
    hasResidencyProgram: false,
    hasPreopClinic: "",
    hasRapidResponseTeam: false,
    financingType: "",
    hasEthicsCommittee: false,
    universityAffiliated: false,
    notes: "",
    
    // Primary Coordinator
    coordinatorName: "",
    coordinatorEmail: "",
    coordinatorPhone: "",
    coordinatorPosition: ""
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Información Básica del Hospital</h3>
        <p className="text-sm text-gray-600 mb-6">
          Esta información es de solo lectura y fue proporcionada por el administrador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Hospital</Label>
          <Input
            id="name"
            value={formData.name}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <Input
            id="province"
            value={formData.province}
            disabled
            className="bg-gray-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            disabled
            className="bg-gray-50"
          />
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
        <div className="space-y-2">
          <Label htmlFor="numBeds">Número de Camas</Label>
          <Input
            id="numBeds"
            type="number"
            value={formData.numBeds}
            onChange={(e) => handleInputChange('numBeds', parseInt(e.target.value) || 0)}
            placeholder="Ej: 200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numOperatingRooms">Quirófanos</Label>
          <Input
            id="numOperatingRooms"
            type="number"
            value={formData.numOperatingRooms}
            onChange={(e) => handleInputChange('numOperatingRooms', parseInt(e.target.value) || 0)}
            placeholder="Ej: 8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numIcuBeds">Camas de UCI</Label>
          <Input
            id="numIcuBeds"
            type="number"
            value={formData.numIcuBeds}
            onChange={(e) => handleInputChange('numIcuBeds', parseInt(e.target.value) || 0)}
            placeholder="Ej: 20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="avgWeeklySurgeries">Cirugías Semanales Promedio</Label>
          <Input
            id="avgWeeklySurgeries"
            type="number"
            value={formData.avgWeeklySurgeries}
            onChange={(e) => handleInputChange('avgWeeklySurgeries', parseInt(e.target.value) || 0)}
            placeholder="Ej: 50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="financingType">Tipo de Financiamiento</Label>
          <Select value={formData.financingType} onValueChange={(value) => handleInputChange('financingType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Público</SelectItem>
              <SelectItem value="private">Privado</SelectItem>
              <SelectItem value="mixed">Mixto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hasPreopClinic">Clínica Preoperatoria</Label>
          <Select value={formData.hasPreopClinic} onValueChange={(value) => handleInputChange('hasPreopClinic', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="coordinatorName">Nombre Completo</Label>
          <Input
            id="coordinatorName"
            value={formData.coordinatorName}
            onChange={(e) => handleInputChange('coordinatorName', e.target.value)}
            placeholder="Ej: Dr. Juan Pérez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coordinatorEmail">Correo Electrónico</Label>
          <Input
            id="coordinatorEmail"
            type="email"
            value={formData.coordinatorEmail}
            onChange={(e) => handleInputChange('coordinatorEmail', e.target.value)}
            placeholder="coordinador@hospital.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coordinatorPhone">Teléfono</Label>
          <Input
            id="coordinatorPhone"
            value={formData.coordinatorPhone}
            onChange={(e) => handleInputChange('coordinatorPhone', e.target.value)}
            placeholder="+54 11 1234-5678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coordinatorPosition">Cargo</Label>
          <Input
            id="coordinatorPosition"
            value={formData.coordinatorPosition}
            onChange={(e) => handleInputChange('coordinatorPosition', e.target.value)}
            placeholder="Ej: Jefe de Cirugía"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('coordinator.hospitalForm')}</h1>
        <p className="text-gray-600 mt-2">
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
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar Borrador
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          ) : (
            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
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
    </div>
  );
}
