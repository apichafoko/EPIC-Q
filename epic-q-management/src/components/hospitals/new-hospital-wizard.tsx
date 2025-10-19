'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { NewHospitalForm, provinces, specialties, financingTypes, preopClinicOptions } from '@/types';

interface NewHospitalWizardProps {
  onComplete: (data: NewHospitalForm) => void;
}

export function NewHospitalWizard({ onComplete }: NewHospitalWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NewHospitalForm>({
    name: '',
    province: '',
    city: '',
    status: 'initial_contact',
    participated_lasos: false,
    financing_type: 'public',
    num_beds: undefined,
    num_operating_rooms: undefined,
    num_icu_beds: undefined,
    avg_weekly_surgeries: undefined,
    has_residency_program: false,
    has_preop_clinic: 'sometimes',
    has_rapid_response_team: false,
    has_ethics_committee: false,
    university_affiliated: false,
    notes: '',
    coordinator_name: '',
    coordinator_email: '',
    coordinator_phone: '',
    coordinator_specialty: 'Anestesia'
  });

  const steps = [
    { number: 1, title: 'Información Básica', description: 'Datos principales del hospital' },
    { number: 2, title: 'Datos Estructurales', description: 'Características del hospital' },
    { number: 3, title: 'Coordinador Principal', description: 'Contacto principal del estudio' }
  ];

  const updateFormData = (field: keyof NewHospitalForm, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
    router.push('/hospitals');
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.province && formData.city;
      case 2:
        return true; // Datos estructurales son opcionales
      case 3:
        return formData.coordinator_name && formData.coordinator_email;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="name">Nombre del Hospital *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Ej: Hospital Italiano de Buenos Aires"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="province">Provincia *</Label>
          <Select value={formData.province} onValueChange={(value) => updateFormData('province', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar provincia" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            placeholder="Ej: Buenos Aires"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="status">Estado Inicial</Label>
          <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial_contact">Contacto Inicial</SelectItem>
              <SelectItem value="pending_evaluation">Evaluación Pendiente</SelectItem>
              <SelectItem value="ethics_approval_process">Aprobación Ética</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="participated_lasos"
          checked={formData.participated_lasos}
          onCheckedChange={(checked) => updateFormData('participated_lasos', checked)}
        />
        <Label htmlFor="participated_lasos">¿Participó del estudio LASOS?</Label>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="financing_type">Tipo de Financiamiento</Label>
          <Select value={formData.financing_type} onValueChange={(value) => updateFormData('financing_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {financingTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'private' ? 'Privado' :
                   type === 'public' ? 'Público' :
                   type === 'social_security' ? 'Obra Social' : 'Otro'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label htmlFor="num_beds">Número de Camas</Label>
          <Input
            id="num_beds"
            type="number"
            value={formData.num_beds || ''}
            onChange={(e) => updateFormData('num_beds', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 150"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="num_operating_rooms">Quirófanos</Label>
          <Input
            id="num_operating_rooms"
            type="number"
            value={formData.num_operating_rooms || ''}
            onChange={(e) => updateFormData('num_operating_rooms', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 5"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="num_icu_beds">Camas UTI</Label>
          <Input
            id="num_icu_beds"
            type="number"
            value={formData.num_icu_beds || ''}
            onChange={(e) => updateFormData('num_icu_beds', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 12"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="avg_weekly_surgeries">Cirugías Semanales Promedio</Label>
          <Input
            id="avg_weekly_surgeries"
            type="number"
            value={formData.avg_weekly_surgeries || ''}
            onChange={(e) => updateFormData('avg_weekly_surgeries', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ej: 25"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="has_preop_clinic">Consultorio Prequirúrgico</Label>
          <Select value={formData.has_preop_clinic} onValueChange={(value) => updateFormData('has_preop_clinic', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {preopClinicOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'always' ? 'Siempre' :
                   option === 'sometimes' ? 'A veces' : 'Nunca'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Características Adicionales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_residency_program"
              checked={formData.has_residency_program}
              onCheckedChange={(checked) => updateFormData('has_residency_program', checked)}
            />
            <Label htmlFor="has_residency_program">Tiene programa de residencias</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_rapid_response_team"
              checked={formData.has_rapid_response_team}
              onCheckedChange={(checked) => updateFormData('has_rapid_response_team', checked)}
            />
            <Label htmlFor="has_rapid_response_team">Equipo de respuesta rápida</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_ethics_committee"
              checked={formData.has_ethics_committee}
              onCheckedChange={(checked) => updateFormData('has_ethics_committee', checked)}
            />
            <Label htmlFor="has_ethics_committee">Comité de ética</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="university_affiliated"
              checked={formData.university_affiliated}
              onCheckedChange={(checked) => updateFormData('university_affiliated', checked)}
            />
            <Label htmlFor="university_affiliated">Afiliación universitaria</Label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="notes">Notas Adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateFormData('notes', e.target.value)}
          placeholder="Información adicional sobre el hospital..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="coordinator_name">Nombre Completo *</Label>
          <Input
            id="coordinator_name"
            value={formData.coordinator_name}
            onChange={(e) => updateFormData('coordinator_name', e.target.value)}
            placeholder="Ej: Dr. María González"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="coordinator_email">Email *</Label>
          <Input
            id="coordinator_email"
            type="email"
            value={formData.coordinator_email}
            onChange={(e) => updateFormData('coordinator_email', e.target.value)}
            placeholder="Ej: maria.gonzalez@hospital.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="coordinator_phone">Teléfono</Label>
          <Input
            id="coordinator_phone"
            value={formData.coordinator_phone}
            onChange={(e) => updateFormData('coordinator_phone', e.target.value)}
            placeholder="Ej: +54 11 1234-5678"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="coordinator_specialty">Especialidad</Label>
          <Select value={formData.coordinator_specialty} onValueChange={(value) => updateFormData('coordinator_specialty', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= step.number 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-300 text-gray-500'
            }`}>
              {currentStep > step.number ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{step.number}</span>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center space-x-2">
          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid(currentStep)}
            >
              <Check className="h-4 w-4 mr-2" />
              Guardar Hospital
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
