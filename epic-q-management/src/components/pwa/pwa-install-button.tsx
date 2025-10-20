'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useTranslations } from '@/hooks/useTranslations';

interface PWAInstallButtonProps {
  userRole: 'admin' | 'coordinator';
  className?: string;
}

export function PWAInstallButton({ userRole, className }: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isMobile, promptInstall } = usePWAInstall();
  const { t } = useTranslations();

  // No mostrar si ya está instalada o no se puede instalar
  if (isInstalled || !canInstall) {
    return null;
  }

  // Para admin: solo mostrar en móvil
  if (userRole === 'admin' && !isMobile) {
    return null;
  }

  // Para coordinator: mostrar siempre
  if (userRole === 'coordinator' && !canInstall) {
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
