'use client';

import { Button } from '../../components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTranslations } from '../../hooks/useTranslations';

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

  // Para coordinator: siempre mostrar si está en móvil o si canInstall es true
  if (userRole === 'coordinator') {
    if (!isMobile && !canInstall) {
      console.log('🚫 No mostrar botón PWA: coordinator en desktop sin canInstall');
      return null;
    }
  }
  
  // Si no hay canInstall pero estamos en móvil, mostrar de todos modos
  if (!canInstall && !isMobile) {
    console.log('🚫 No mostrar botón PWA: no se puede instalar y no es móvil');
    return null;
  }

  const handleInstall = async () => {
    try {
      await promptInstall();
    } catch (error) {
      console.error('Error al instalar la PWA:', error);
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
