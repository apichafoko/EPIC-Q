'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallHook {
  canInstall: boolean;
  isInstalled: boolean;
  isMobile: boolean;
  promptInstall: () => Promise<void>;
  lastPromptDate: number | null;
  shouldShowPrompt: (userId: string) => boolean;
  dismissPrompt: (userId: string) => void;
}

export function usePWAInstall(): PWAInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si la app ya está instalada
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as any).standalone === true; // iOS Safari
      setIsInstalled(isStandalone || isInApp);
    };

    // Detectar si es dispositivo móvil
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    // Verificar estado inicial
    checkInstalled();
    checkMobile();

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Escuchar evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Escuchar cambios de tamaño de pantalla
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const promptInstall = async (): Promise<void> => {
    if (!deferredPrompt) {
      console.warn('No se puede instalar la PWA: beforeinstallprompt no disponible');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó la instalación de la PWA');
      } else {
        console.log('Usuario rechazó la instalación de la PWA');
      }
    } catch (error) {
      console.error('Error al mostrar el prompt de instalación:', error);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const getLastDismissTime = (userId: string): number | null => {
    const key = `pwa_install_dismissed_${userId}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored) : null;
  };

  const shouldShowPrompt = (userId: string): boolean => {
    if (isInstalled || !deferredPrompt) return false;
    
    const lastDismiss = getLastDismissTime(userId);
    if (!lastDismiss) return true;
    
    const daysSince = (Date.now() - lastDismiss) / (1000 * 60 * 60 * 24);
    return daysSince >= 30;
  };

  const dismissPrompt = (userId: string): void => {
    const key = `pwa_install_dismissed_${userId}`;
    localStorage.setItem(key, Date.now().toString());
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isInstalled,
    isMobile,
    promptInstall,
    lastPromptDate: null, // Se puede implementar si se necesita
    shouldShowPrompt,
    dismissPrompt
  };
}
