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

  console.log('🔍 PWA Install Button - canInstall:', canInstall, 'isInstalled:', isInstalled, 'isMobile:', isMobile, 'userRole:', userRole);

  // No mostrar si ya está instalada
  if (isInstalled) {
    console.log('🚫 No mostrar botón PWA: ya está instalada');
    return null;
  }

  // Para admin: solo mostrar en móvil
  if (userRole === 'admin' && !isMobile) {
    console.log('🚫 No mostrar botón PWA: admin en desktop');
    return null;
  }

  // Para coordinator: solo mostrar en móvil
  if (userRole === 'coordinator' && !isMobile) {
    console.log('🚫 No mostrar botón PWA: coordinator en desktop');
    return null;
  }
  
  // Ahora estamos en móvil - mostrar el botón
  console.log('✅ Mostrar botón PWA: en móvil para', userRole);

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
