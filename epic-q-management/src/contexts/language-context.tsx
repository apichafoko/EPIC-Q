'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { languageConfig, type Locale } from '@/i18n/config';

interface LanguageContextType {
  currentLocale: Locale;
  setLanguage: (locale: Locale) => void;
  languageConfig: typeof languageConfig[Locale];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const currentLocale = useLocale() as Locale;

  const setLanguage = async (locale: Locale) => {
    if (locale === currentLocale) return;

    setIsLoading(true);
    
    try {
      // Guardar preferencia en localStorage
      localStorage.setItem('preferred-language', locale);
      
      // Obtener la ruta actual sin el locale
      const currentPath = window.location.pathname;
      const pathWithoutLocale = currentPath.replace(`/${currentLocale}`, '') || '/';
      
      // Construir nueva ruta con el nuevo locale
      const newPath = `/${locale}${pathWithoutLocale}`;
      
      // Navegar a la nueva ruta
      router.push(newPath);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar preferencia guardada al inicializar
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Locale;
    if (savedLanguage && savedLanguage !== currentLocale) {
      setLanguage(savedLanguage);
    }
  }, []);

  const value: LanguageContextType = {
    currentLocale,
    setLanguage,
    languageConfig: languageConfig[currentLocale],
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook para obtener solo la configuración del idioma
export function useLanguageConfig() {
  const { languageConfig } = useLanguage();
  return languageConfig;
}

// Hook para cambiar idioma
export function useSetLanguage() {
  const { setLanguage, isLoading } = useLanguage();
  return { setLanguage, isLoading };
}
