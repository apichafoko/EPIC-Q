'use client';

import { useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useAuth } from '../../contexts/auth-context';

export function PWAManifestRegistrator() {
  const { locale } = useTranslations();
  const { user } = useAuth();

  useEffect(() => {
    // Determinar la URL de inicio según el rol del usuario
    let startUrl = `/${locale}/`;
    
    if (user) {
      if (user.role === 'admin') {
        startUrl = `/${locale}/admin`;
      } else if (user.role === 'coordinator') {
        startUrl = `/${locale}/coordinator`;
      }
    }
    
    // Actualizar el manifest dinámicamente
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (manifestLink) {
      // Actualizar el href para incluir el locale actual y la start URL
      manifestLink.href = `/api/manifest?locale=${locale}&startUrl=${encodeURIComponent(startUrl)}`;
    } else {
      // Si no existe, crearlo
      const newManifestLink = document.createElement('link');
      newManifestLink.rel = 'manifest';
      newManifestLink.href = `/api/manifest?locale=${locale}&startUrl=${encodeURIComponent(startUrl)}`;
      document.head.appendChild(newManifestLink);
    }
  }, [locale, user]);

  return null;
}
