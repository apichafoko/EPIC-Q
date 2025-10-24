'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTranslations } from '@/hooks/useTranslations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLoadingState } from '@/hooks/useLoadingState';
import { toast } from 'sonner';
import { User, Mail, Calendar, Shield, Globe, Clock, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { t, locale } = useTranslations();
  const { isLoading, executeWithLoading } = useLoadingState();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredLanguage: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    country: 'AR',
    role: '',
    isActive: true,
    lastLogin: null,
    createdAt: null
  });

  const [isEditing, setIsEditing] = useState(false);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        preferredLanguage: user.preferredLanguage || 'es',
        timezone: (user as any).timezone || 'America/Argentina/Buenos_Aires',
        country: (user as any).country || 'AR',
        role: user.role || '',
        isActive: user.isActive || false,
        lastLogin: null,
        createdAt: null
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    await executeWithLoading(async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            preferredLanguage: formData.preferredLanguage,
            timezone: formData.timezone,
            country: formData.country
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.success('Perfil actualizado exitosamente');
          setIsEditing(false);
          await refreshUser();
        } else {
          toast.error('Error al actualizar el perfil: ' + (data.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
      }
    });
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        preferredLanguage: user.preferredLanguage || 'es',
        timezone: (user as any).timezone || 'America/Argentina/Buenos_Aires',
        country: (user as any).country || 'AR',
        role: user.role || '',
        isActive: user.isActive || false,
        lastLogin: null,
        createdAt: null
      });
    }
    setIsEditing(false);
  };

  const timezones = [
    { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
    { value: 'America/Argentina/Cordoba', label: 'Córdoba (GMT-3)' },
    { value: 'America/Argentina/Mendoza', label: 'Mendoza (GMT-3)' },
    { value: 'America/Argentina/Salta', label: 'Salta (GMT-3)' },
    { value: 'America/Argentina/Tucuman', label: 'Tucumán (GMT-3)' },
    { value: 'America/Argentina/Ushuaia', label: 'Ushuaia (GMT-3)' },
    { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
    { value: 'America/New_York', label: 'New York (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
    { value: 'UTC', label: 'UTC (GMT+0)' }
  ];

  const countries = [
    { value: 'AR', label: 'Argentina', flag: '🇦🇷' },
    { value: 'BR', label: 'Brasil', flag: '🇧🇷' },
    { value: 'CL', label: 'Chile', flag: '🇨🇱' },
    { value: 'CO', label: 'Colombia', flag: '🇨🇴' },
    { value: 'MX', label: 'México', flag: '🇲🇽' },
    { value: 'PE', label: 'Perú', flag: '🇵🇪' },
    { value: 'UY', label: 'Uruguay', flag: '🇺🇾' },
    { value: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
    { value: 'ES', label: 'España', flag: '🇪🇸' },
    { value: 'FR', label: 'Francia', flag: '🇫🇷' }
  ];

  const languages = [
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'pt', label: 'Português', flag: '🇧🇷' }
  ];

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Información Personal</span>
              </CardTitle>
              <CardDescription>
                Actualiza tu información personal y preferencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50"
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-gray-500">El email no se puede cambiar</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Preferencias Regionales</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={formData.preferredLanguage}
                      onValueChange={(value) => handleInputChange('preferredLanguage', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <div className="flex items-center space-x-2">
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="country">País</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => handleInputChange('country', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            <div className="flex items-center space-x-2">
                              <span>{country.flag}</span>
                              <span>{country.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información de Cuenta */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Información de Cuenta</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Rol</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.role === 'admin' ? 'default' : 'secondary'}>
                    {formData.role === 'admin' ? 'Administrador' : 'Coordinador'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.isActive ? 'default' : 'destructive'}>
                    {formData.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {formData.lastLogin && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Último Acceso</span>
                  </Label>
                  <p className="text-sm text-gray-600">
                    {new Date(formData.lastLogin).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {formData.createdAt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Miembro Desde</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(formData.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
