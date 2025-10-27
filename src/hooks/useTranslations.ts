'use client';

import { useTranslations as useNextIntlTranslations, useLocale } from 'next-intl';

export function useTranslations() {
  const t = useNextIntlTranslations();
  const locale = useLocale();
  
  return { t, locale };
}