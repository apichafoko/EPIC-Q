'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface LocaleProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

export function LocaleProvider({ children, locale, messages }: LocaleProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
