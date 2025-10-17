'use client';

import { useEffect } from 'react';

interface LocaleWrapperProps {
  locale: string;
  children: React.ReactNode;
}

export function LocaleWrapper({ locale, children }: LocaleWrapperProps) {
  useEffect(() => {
    // Actualizar el atributo lang del html
    document.documentElement.lang = locale;
  }, [locale]);

  return <>{children}</>;
}
