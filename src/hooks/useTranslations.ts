'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

// Importar las traducciones
import esMessages from '../messages/es.json';
import ptMessages from '../messages/pt.json';
import enMessages from '../messages/en.json';

const messages = {
  es: esMessages,
  pt: ptMessages,
  en: enMessages,
};

export function useTranslations() {
  const pathname = usePathname();
  
  // Extraer el locale del pathname
  const locale = useMemo(() => {
    const segments = pathname.split('/');
    return segments[1] || 'es';
  }, [pathname]);

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = messages[locale as keyof typeof messages];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
    
    // Reemplazar parámetros
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return String(params[paramKey] || match);
      });
    }
    
    return value;
  };

  return { t, locale };
}