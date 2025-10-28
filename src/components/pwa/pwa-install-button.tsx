'use client';

import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTranslations } from '../../hooks/useTranslations';
import { toast } from 'sonner';

interface PWAInstallButtonProps {
  userRole: 'admin' | 'coordinator';
  className?: string;
}

export function PWAInstallButton({ userRole, className }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isMobile, promptInstall } = usePWAInstall();
  const { t } = useTranslations();

  // No mostrar si ya está instalada
  if (isInstalled) {
    return null;
  }

  // Solo mostrar en móvil
  if (!isMobile) {
    return null;
  }

  const handleInstall = async () => {
    try {
      if (canInstall) {
        await promptInstall();
      } else {
        // Si no hay canInstall, mostrar instrucciones con toast
        toast.info('Para instalar EPIC-Q:', {
          description: 'En Android: Toca el menú (⋮) > "Agregar a pantalla de inicio" | En iOS: Toca el botón de compartir > "Agregar a pantalla de inicio"',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('Error al instalar la PWA:', error);
      toast.error('No se pudo instalar la aplicación');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleInstall}
      className={className}
      title={t('pwa.install')}
    >
      <Download className="h-4 w-4" />
      <span className="ml-2 hidden md:inline">
        {t('pwa.install')}
      </span>
    </Button>
  );
}
