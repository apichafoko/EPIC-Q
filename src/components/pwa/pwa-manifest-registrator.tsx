'use client';

import { useEffect } from 'react';
import { useTranslations } from '../../hooks/useTranslations';

export function PWAManifestRegistrator() {
  const { locale } = useTranslations();

  useEffect(() => {
    // Actualizar el manifest dinámicamente cuando cambie el locale
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    
    if (manifestLink) {
      // Actualizar el href para incluir el locale actual
      manifestLink.href = `/api/manifest?locale=${locale}`;
      
      // Forzar la recarga del manifest
      manifestLink.remove();
      const newManifestLink = document.createElement('link');
      newManifestLink.rel = 'manifest';
      newManifestLink.href = `/api/manifest?locale=${locale}`;
      document.head.appendChild(newManifestLink);
    } else {
      // Si no existe, crearlo
      const newManifestLink = document.createElement('link');
      newManifestLink.rel = 'manifest';
      newManifestLink.href = `/api/manifest?locale=${locale}`;
      document.head.appendChild(newManifestLink);
    }
  }, [locale]);

  return null;
}

