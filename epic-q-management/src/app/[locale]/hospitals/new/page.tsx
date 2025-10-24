'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { NewHospitalWizard } from '../../../../components/hospitals/new-hospital-wizard';
import { NewHospitalForm } from '../../../../types';
import { toast } from 'sonner';

export default function NewHospitalPage() {
  const router = useRouter();
  const params = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (data: NewHospitalForm) => {
    setIsSubmitting(true);
    
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí se haría la llamada a la API real
      console.log('Nuevo hospital:', data);
      
      toast.success('Hospital creado exitosamente');
      router.push(`/${params.locale}/hospitals`);
    } catch (error) {
      toast.error('Error al crear el hospital');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Hospital</h1>
          <p className="text-gray-600 mt-2">
            Agregar un nuevo hospital al estudio EPIC-Q
          </p>
        </div>
      </div>

      {/* Wizard */}
      <NewHospitalWizard onComplete={handleComplete} />
    </div>
  );
}
