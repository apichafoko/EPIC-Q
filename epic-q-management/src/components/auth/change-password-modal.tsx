'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export function ChangePasswordModal({ isOpen, onSuccess }: ChangePasswordModalProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.currentPassword && 
                     formData.newPassword && 
                     formData.confirmPassword &&
                     formData.newPassword === formData.confirmPassword &&
                     formData.newPassword.length >= 8;

  if (success) {
    return (
      <Modal open={isOpen} onOpenChange={() => {}}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center space-x-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span>¡Contraseña Cambiada!</span>
            </ModalTitle>
            <ModalDescription>
              Tu contraseña ha sido actualizada exitosamente. Serás redirigido al dashboard.
            </ModalDescription>
          </ModalHeader>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onOpenChange={() => {}}>
      <ModalContent className="sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center space-x-2 text-amber-600">
            <Shield className="h-5 w-5" />
            <span>Cambio de Contraseña Requerido</span>
          </ModalTitle>
          <ModalDescription>
            Por seguridad, debes cambiar tu contraseña temporal antes de continuar.
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Repite tu nueva contraseña"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
