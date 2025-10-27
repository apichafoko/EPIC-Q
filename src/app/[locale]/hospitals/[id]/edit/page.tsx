'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../../../../hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select';
import { Switch } from '../../../../../components/ui/switch';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLoadingState } from '../../../../../hooks/useLoadingState';

interface Hospital {
  id: string;
  name: string;
  redcap_id?: string;
  province: string;
  city: string;
  status: string;
  participated_lasos: boolean;
  created_at: string;
  updated_at: string;
}

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán'
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' }
];

export default function EditHospitalPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { t } = useTranslations();
  const router = useRouter();
  const { isLoading, executeWithLoading } = useLoadingState();
  
  // Desenvolver los parámetros usando React.use()
  const { id, locale } = use(params);
  
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    redcap_id: '',
    province: '',
    city: '',
    status: 'active',
    participated_lasos: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadHospital();
  }, [id]);

  const loadHospital = async () => {
    try {
      const response = await fetch(`/api/hospitals/${id}`);

      if (!response.ok) {
        let errorMessage = 'No se pudo cargar la información del hospital';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        toast.error('Error al cargar el hospital', {
          description: errorMessage
        });
        router.push(`/${(await params).locale}/hospitals`);
        return;
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error('Respuesta vacía del servidor');
        }
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Error parsing response JSON:', jsonError);
        toast.error('Error al cargar el hospital', {
          description: 'Error al procesar la respuesta del servidor'
        });
        router.push(`/${(await params).locale}/hospitals`);
        return;
      }

      setHospital(data.hospital);
      setFormData({
        name: data.hospital.name || '',
        redcap_id: data.hospital.redcap_id || '',
        province: data.hospital.province || '',
        city: data.hospital.city || '',
        status: data.hospital.status || 'pending',
        participated_lasos: data.hospital.participated_lasos || false
      });
    } catch (error) {
      console.error('Error loading hospital:', error);
      toast.error('Error al cargar el hospital', {
        description: 'Ocurrió un error inesperado'
      });
      router.push(`/${(await params).locale}/hospitals`);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del hospital es requerido';
    }

    if (!formData.province) {
      newErrors.province = 'La provincia es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    await executeWithLoading(async () => {
      try {
        const response = await fetch(`/api/hospitals/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Hospital actualizado exitosamente', {
            description: `El hospital "${formData.name}" ha sido actualizado`
          });
          router.push(`/${(await params).locale}/hospitals`);
        } else {
          toast.error('Error al actualizar el hospital', {
            description: data.error || 'Inténtalo de nuevo más tarde'
          });
        }
      } catch (error) {
        console.error('Error updating hospital:', error);
        toast.error('Error al actualizar el hospital', {
          description: 'Ocurrió un error inesperado'
        });
      }
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!hospital) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando hospital...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${locale}/hospitals`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Hospital</h1>
            <p className="text-gray-600">Modifica la información del hospital</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Información General</CardTitle>
          <CardDescription>
            Actualiza los datos básicos del hospital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nombre del Hospital */}
          <div className="space-y-3">
            <Label htmlFor="name">Nombre del Hospital *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa el nombre del hospital"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* ID RedCap */}
          <div className="space-y-3">
            <Label htmlFor="redcap_id">ID RedCap</Label>
            <Input
              id="redcap_id"
              value={formData.redcap_id}
              onChange={(e) => handleInputChange('redcap_id', e.target.value)}
              placeholder="Ingresa el ID de RedCap (opcional)"
            />
            <p className="text-sm text-gray-500">
              Identificador único en el sistema RedCap
            </p>
          </div>

          {/* Provincia y Ciudad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="province">Provincia *</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => handleInputChange('province', value)}
              >
                <SelectTrigger className={errors.province ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona una provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-sm text-red-600">{errors.province}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="city">Ciudad *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ingresa la ciudad"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city}</p>
              )}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-3">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Participación en LASOS */}
          <div className="flex items-center space-x-2">
            <Switch
              id="participated_lasos"
              checked={formData.participated_lasos}
              onCheckedChange={(checked) => handleInputChange('participated_lasos', checked)}
            />
            <Label htmlFor="participated_lasos">
              Participó en estudios LASOS
            </Label>
          </div>

          {/* Información adicional */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Los campos marcados con * son obligatorios. Los cambios se guardarán inmediatamente al hacer clic en "Guardar".
            </AlertDescription>
          </Alert>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/hospitals`)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}