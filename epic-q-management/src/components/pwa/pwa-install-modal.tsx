'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Clock } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslations } from '@/hooks/useTranslations';
import { Logo } from '@/components/ui/logo';

interface PWAInstallModalProps {
  userRole: 'admin' | 'coordinator';
  userId: string;
  autoShow?: boolean;
  onClose?: () => void;
}

export function PWAInstallModal({ 
  userRole, 
  userId, 
  autoShow = false, 
  onClose 
}: PWAInstallModalProps) {
  const { canInstall, isInstalled, shouldShowPrompt, dismissPrompt, promptInstall } = usePWAInstall();
  const { t } = useTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar para coordinadores
    if (userRole !== 'coordinator') {
      return;
    }

    // No mostrar si ya está instalada
    if (isInstalled) {
      return;
    }

    // Si es autoShow, verificar si debe mostrarse
    if (autoShow && shouldShowPrompt(userId)) {
      setIsVisible(true);
    }
  }, [userRole, userId, autoShow, isInstalled, shouldShowPrompt]);

  const handleInstall = async () => {
    try {
      await promptInstall();
      setIsVisible(false);
      onClose?.();
    } catch (error) {
      console.error('Error al instalar la PWA:', error);
    }
  };

  const handleRemindLater = () => {
    dismissPrompt(userId);
    setIsVisible(false);
    onClose?.();
  };

  const handleDismiss = () => {
    dismissPrompt(userId);
    setIsVisible(false);
    onClose?.();
  };

  // No mostrar si no es visible o no se puede instalar
  if (!isVisible || !canInstall || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" showText={false} />
          </div>
          <CardTitle className="text-xl">
            {t('pwa.installTitle')}
          </CardTitle>
          <CardDescription>
            {t('pwa.installDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleInstall}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('pwa.installNow')}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleRemindLater}
              className="w-full"
            >
              <Clock className="h-4 w-4 mr-2" />
              {t('pwa.remindLater')}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleDismiss}
              className="w-full"
            >
              {t('pwa.notNow')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
