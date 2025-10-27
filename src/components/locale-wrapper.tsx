'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export function LocaleWrapper({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  
  useEffect(() => {
    // Actualizar el atributo lang del html
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
