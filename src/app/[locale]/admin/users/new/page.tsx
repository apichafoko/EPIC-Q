'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../../../../hooks/useTranslations';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../components/ui/select';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../../../../components/ui/alert';
import { 
  ArrowLeft, 
  UserPlus, 
  Mail, 
  Shield, 
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  province: string;
  city: string;
}

export default function NewUserPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'coordinator' as 'admin' | 'coordinator',
    hospital_id: '',
    hospital_name: '',
    hospital_option: 'existing' as 'existing' | 'new',
    sendInvitation: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const response = await fetch('/api/hospitals');
      const data = await response.json();
      if (response.ok) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error('Failed to load hospitals:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('users.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('users.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('users.errors.emailInvalid');
    }

    if (formData.role === 'coordinator') {
      if (formData.hospital_option === 'existing' && !formData.hospital_id) {
        newErrors.hospital_id = t('users.errors.hospitalRequired');
      } else if (formData.hospital_option === 'new' && !formData.hospital_name.trim()) {
        newErrors.hospital_name = t('users.errors.hospitalNameRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('users.userCreated'), {
          description: formData.sendInvitation ? 
            t('users.userCreatedDesc') : 
            t('users.userCreatedDescNoEmail')
        });
        setSuccess(true);
        setTimeout(() => {
          router.push('/es/admin/users');
        }, 2000);
      } else {
        // Handle specific error messages
        let errorMessage = t('users.errors.createError');
        if (data.error) {
          if (data.error.includes('email already exists') || data.error.includes('email ya existe')) {
            errorMessage = t('users.errors.userExists');
          } else {
            errorMessage = data.error;
          }
        }
        toast.error('Error al crear el usuario', {
          description: errorMessage
        });
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      toast.error('Error de conexión', {
        description: t('users.errors.connectionError')
      });
      setErrors({ submit: t('users.errors.connectionError') });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for email
    if (field === 'email' && typeof value === 'string') {
      if (value.trim() && !/\S+@\S+\.\S+/.test(value)) {
        setErrors(prev => ({ ...prev, email: t('users.errors.emailInvalid') }));
      } else if (value.trim() && /\S+@\S+\.\S+/.test(value)) {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }
  };

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('users.userCreated')}
              </h2>
              <p className="text-gray-600 mb-4">
                {formData.sendInvitation ? 
                  t('users.userCreatedDesc') :
                  t('users.userCreatedDescNoEmail')
                }
              </p>
              <Button onClick={() => router.push('/admin/users')}>
                {t('users.backToUsers')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('users.createUser')}</h1>
          <p className="text-gray-600 mt-2">
            {t('users.subtitle')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>{t('users.userInfo')}</span>
          </CardTitle>
          <CardDescription>
            {t('users.userInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-3">
              <Label htmlFor="name">{t('users.fullName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('users.fullNamePlaceholder')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-3">
              <Label htmlFor="email">{t('users.email')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t('users.emailPlaceholder')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-3">
              <Label htmlFor="role">{t('users.role')} *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('users.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>{t('users.administrator')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="coordinator">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{t('users.coordinator')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hospital (only for coordinators) */}
            {formData.role === 'coordinator' && (
              <div className="space-y-4">
                <Label>{t('users.hospital')} *</Label>
                
                {/* Hospital Option Selection */}
                <div className="space-y-3">
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="existing_hospital"
                        name="hospital_option"
                        value="existing"
                        checked={formData.hospital_option === 'existing'}
                        onChange={(e) => handleInputChange('hospital_option', e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="existing_hospital" className="text-sm font-medium">
                        Hospital Existente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="new_hospital"
                        name="hospital_option"
                        value="new"
                        checked={formData.hospital_option === 'new'}
                        onChange={(e) => handleInputChange('hospital_option', e.target.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="new_hospital" className="text-sm font-medium">
                        Nuevo Hospital
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Existing Hospital Selection */}
                {formData.hospital_option === 'existing' && (
                  <div className="space-y-3">
                    <Label htmlFor="hospital_id">Seleccionar Hospital</Label>
                    <Select 
                      value={formData.hospital_id} 
                      onValueChange={(value) => handleInputChange('hospital_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('users.selectHospital')} />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitals.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}, {hospital.province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.hospital_id && (
                      <p className="text-sm text-red-500">{errors.hospital_id}</p>
                    )}
                  </div>
                )}

                {/* New Hospital Name Input */}
                {formData.hospital_option === 'new' && (
                  <div className="space-y-3">
                    <Label htmlFor="hospital_name">Nombre del Hospital</Label>
                    <Input
                      id="hospital_name"
                      type="text"
                      value={formData.hospital_name}
                      onChange={(e) => handleInputChange('hospital_name', e.target.value)}
                      placeholder="Ingrese el nombre del hospital"
                      className="w-full"
                    />
                    {errors.hospital_name && (
                      <p className="text-sm text-red-500">{errors.hospital_name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      El coordinador completará el resto de los datos del hospital después del registro.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Send Invitation */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendInvitation"
                checked={formData.sendInvitation}
                onCheckedChange={(checked) => handleInputChange('sendInvitation', checked as boolean)}
              />
              <Label htmlFor="sendInvitation" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{t('users.sendInvitation')}</span>
              </Label>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                {t('users.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('users.creating') : t('users.createUser')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
