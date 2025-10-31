'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';
import { useEffect } from 'react';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Limpiar valores antiguos de tema en localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Si hay una key antigua "theme" con valor "dark" o "system", eliminarla
      const oldTheme = localStorage.getItem('theme');
      if (oldTheme === 'dark' || oldTheme === 'system') {
        localStorage.removeItem('theme');
      }
      
      // Si la key nueva no existe o tiene un valor inválido, establecer "light"
      const currentTheme = localStorage.getItem('epic-q-theme');
      if (!currentTheme || (currentTheme !== 'light' && currentTheme !== 'dark' && currentTheme !== 'high-contrast')) {
        localStorage.setItem('epic-q-theme', 'light');
      }
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

